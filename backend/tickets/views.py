from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model
from .services.ai_complaint_service import analyze_complaint as ai_analyze_complaint
from accounts.permissions import IsEmployee, IsTechnician
from .services.ai_troubleshooting_service import troubleshoot_ticket as ai_troubleshoot_ticket
from .models import Ticket, TicketComment, IssueCategory
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateUpdateSerializer,
    AssignTicketSerializer,
    ChangeStatusSerializer,
    ReopenTicketSerializer,
    IssueCategorySerializer,
)
from .serializers import get_active_assignments
from assets.models import AssetAssignment
from notifications.services import (
    send_ticket_assigned_notification,
    send_status_update_notification,
    send_ticket_resolved_notification,
    send_ticket_reopened_notification,
    send_ticket_closed_notification,
    create_notification,
)

User = get_user_model()


class TicketViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ("ticket_number", "title", "description")
    filterset_fields = (
        "status",
        "priority",
        "department",
        "category",
        "employee",
        "assigned_technician",
    )
    ordering_fields = ("created_at", "updated_at", "priority", "sla_deadline")
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return TicketListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return TicketCreateUpdateSerializer
        return TicketDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Ticket.objects.all()
        elif user.role == "employee":
            return Ticket.objects.filter(employee=user)
        elif user.role == "technician":
            return Ticket.objects.filter(assigned_technician=user)
        return Ticket.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        # Employee: auto-set department from profile, ignore frontend value
        if user.role == "employee":
            profile = getattr(user, 'employee_profile', None)
            dept = profile.department if profile else None
            ticket = serializer.save(employee=user, department=dept)
        else:
            ticket = serializer.save(employee=user)

        create_notification(
            user=ticket.employee,
            title="Ticket Created",
            message=f"Your ticket {ticket.ticket_number} has been created successfully.",
            notification_type="ticket_created",
            ticket=ticket,
        )
        admins = User.objects.filter(role="admin")
        for admin in admins:
            create_notification(
                user=admin,
                title="New Ticket",
                message=f"New ticket {ticket.ticket_number} from {ticket.employee.get_full_name()}: {ticket.title}",
                notification_type="ticket_created",
                ticket=ticket,
            )

    def check_object_permissions(self, request, obj):
        user = request.user
        if request.method == "DELETE":
            if user.role != "admin":
                raise PermissionDenied("Only admins can delete tickets.")
        elif request.method in ["PUT", "PATCH"] and user.role == "employee":
            raise PermissionDenied("Employees cannot directly edit tickets.")

    def destroy(self, request, *args, **kwargs):
        ticket = self.get_object()
        ticket.status = "closed"
        ticket.save()
        return Response(
            {"message": f"Ticket {ticket.ticket_number} deleted (marked closed)."},
            status=status.HTTP_200_OK,
        )

    # ── DROPDOWN LOOKUP ENDPOINTS ──

    @action(detail=False, methods=["get"], url_path="technicians-dropdown")
    def technicians_dropdown(self, request):
        """Return technicians with profile info for dropdowns."""
        technicians = User.objects.filter(
            role="technician"
        ).select_related('technician_profile', 'technician_profile__department')
        data = []
        for t in technicians:
            profile = getattr(t, 'technician_profile', None)
            data.append({
                'id': t.id,
                'name': t.get_full_name(),
                'technician_id': profile.technician_id if profile else None,
                'department': profile.department.name if profile and profile.department else None,
                'specialization': profile.specialization if profile else None,
            })
        return Response(data)

        # ── NEW: MY ELIGIBLE ASSETS (Employee ticket creation dropdown) ──

    @action(detail=False, methods=["get"], url_path="my-assets")
    def my_assets(self, request):
        """Return active assets assigned to current employee."""
        if request.user.role != "employee":
            return Response(
                {"error": "Only employees can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )

        assignments = get_active_assignments(request.user)

        data = []
        for a in assignments:
            data.append({
                'id': a.asset.id,
                'asset_name': a.asset.asset_name,
                'asset_code': a.asset.asset_code,
                'category_name': a.asset.category.name if a.asset.category else None,
                'brand': a.asset.brand,
                'model': a.asset.model,
            })
        return Response(data)

    @action(detail=False, methods=["get"], url_path="employees-dropdown")
    def employees_dropdown(self, request):
        """Return employees with profile info for dropdowns."""
        employees = User.objects.filter(
            role="employee"
        ).select_related('employee_profile', 'employee_profile__department')
        data = []
        for e in employees:
            profile = getattr(e, 'employee_profile', None)
            data.append({
                'id': e.id,
                'name': e.get_full_name(),
                'employee_id': profile.employee_id if profile else None,
                'department': profile.department.name if profile and profile.department else None,
                'designation': profile.designation if profile else None,
            })
        return Response(data)

    # ── WORKFLOW ACTIONS ──

    @action(detail=True, methods=["post"], url_path="assign")
    def assign_ticket(self, request, pk=None):
        if request.user.role != "admin":
            raise PermissionDenied("Only admins can assign tickets.")

        ticket = self.get_object()
        if ticket.status == "closed":
            raise ValidationError({"error": "Cannot assign a closed ticket."})

        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            technician = User.objects.get(
                id=serializer.validated_data["technician_id"], role="technician"
            )
        except User.DoesNotExist:
            raise ValidationError(
                {"error": "Invalid technician ID or user is not a technician."}
            )

        old_status = ticket.status
        ticket.assigned_technician = technician
        ticket.assigned_by = request.user
        ticket.assigned_at = timezone.now()
        if ticket.status == "open":
            ticket.status = "assigned"
        ticket.save()

        send_ticket_assigned_notification(ticket)
        send_status_update_notification(ticket, old_status, ticket.status)

        create_notification(
            user=technician,
            title="Ticket Assigned",
            message=f"You have been assigned ticket {ticket.ticket_number}: {ticket.title}",
            notification_type="ticket_assigned",
            ticket=ticket,
        )
        create_notification(
            user=ticket.employee,
            title="Technician Assigned",
            message=f"Your ticket {ticket.ticket_number} has been assigned to {technician.get_full_name()}.",
            notification_type="ticket_assigned",
            ticket=ticket,
        )

        return Response(
            {
                "message": f"Ticket assigned to {technician.get_full_name()}",
                "status": ticket.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        ticket = self.get_object()
        serializer = ChangeStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        old_status = ticket.status
        user = request.user

        if user.role == "technician":
            allowed_transitions = {
                "assigned": "in_progress",
                "in_progress": "resolved",
                "reopened": "in_progress",
            }
            if (
                old_status not in allowed_transitions
                or allowed_transitions[old_status] != new_status
            ):
                raise ValidationError(
                    {"error": f"Technicians can only change: Assigned → In Progress → Resolved."}
                )

            if new_status == "resolved":
                ticket.resolved_at = timezone.now()
                send_ticket_resolved_notification(ticket)

                create_notification(
                    user=ticket.employee,
                    title="Ticket Resolved",
                    message=f"Your ticket {ticket.ticket_number} has been resolved. Please review and confirm.",
                    notification_type="ticket_resolved",
                    ticket=ticket,
                )

            if new_status == "in_progress":
                create_notification(
                    user=ticket.employee,
                    title="Ticket In Progress",
                    message=f"Your ticket {ticket.ticket_number} is now being worked on.",
                    notification_type="ticket_status",
                    ticket=ticket,
                )

        elif user.role == "admin":
            if new_status == "resolved" and not ticket.resolved_at:
                ticket.resolved_at = timezone.now()

        ticket.status = new_status
        ticket.save()

        send_status_update_notification(ticket, old_status, new_status)

        return Response(
            {"message": f"Status changed to {new_status}", "status": ticket.status},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen_ticket(self, request, pk=None):
        if request.user.role != "employee":
            raise PermissionDenied("Only employees can reopen tickets.")

        ticket = self.get_object()
        if ticket.status != "resolved":
            raise ValidationError(
                {"error": "Only RESOLVED tickets can be reopened. Closed tickets cannot be reopened."}
            )
        if ticket.employee != request.user:
            raise PermissionDenied("You can only reopen your own tickets.")

        serializer = ReopenTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        old_status = ticket.status
        ticket.status = "reopened"
        ticket.reopen_reason = reason
        ticket.resolved_at = None
        ticket.save()

        # ── NEW: Reason-ah comment thread-la auto-comment ah add pannurom ──
        # Itha nambi Technician/Admin ticket page comment section-la kaapaadum
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=f"Ticket REOPENED by employee.\n\nReason: {reason}"
        )

        send_ticket_reopened_notification(ticket)

        admins = User.objects.filter(role="admin")
        for admin in admins:
            create_notification(
                user=admin,
                title="Ticket Reopened",
                message=f"Ticket {ticket.ticket_number} has been reopened by {ticket.employee.get_full_name()}. Reason: {reason}",
                notification_type="ticket_reopened",
                ticket=ticket,
            )
        if ticket.assigned_technician:
            create_notification(
                user=ticket.assigned_technician,
                title="Ticket Reopened",
                message=f"Ticket {ticket.ticket_number} has been reopened by the employee. Reason: {reason}",
                notification_type="ticket_reopened",
                ticket=ticket,
            )

        return Response(
            {
                "message": "Ticket reopened successfully.",
                "status": ticket.status,
                "reopen_reason": reason,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="confirm-resolution")
    def confirm_resolution(self, request, pk=None):
        if request.user.role != "employee":
            raise PermissionDenied("Only employees can confirm resolution.")

        ticket = self.get_object()
        if ticket.status != "resolved":
            raise ValidationError({"error": "Only RESOLVED tickets can be confirmed."})
        if ticket.employee != request.user:
            raise PermissionDenied("You can only confirm your own tickets.")

        old_status = ticket.status
        ticket.status = "closed"
        ticket.save()

        send_ticket_closed_notification(ticket)

        if ticket.assigned_technician:
            create_notification(
                user=ticket.assigned_technician,
                title="Ticket Closed",
                message=f"Ticket {ticket.ticket_number} has been confirmed and closed by the employee.",
                notification_type="ticket_closed",
                ticket=ticket,
            )

        return Response(
            {
                "message": "Resolution confirmed. Ticket closed.",
                "status": ticket.status,
            },
            status=status.HTTP_200_OK,
        )


class IssueCategoryViewSet(viewsets.ModelViewSet):
    queryset = IssueCategory.objects.all()
    serializer_class = IssueCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


from .serializers import TicketCommentSerializer, TicketCommentListSerializer


class TicketCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TicketCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return TicketCommentListSerializer
        return TicketCommentSerializer

    def get_queryset(self):
        ticket_id = self.kwargs.get("ticket_pk")
        return TicketComment.objects.filter(ticket_id=ticket_id)

    def perform_create(self, serializer):
        user = self.request.user

        # =================================================
        # NEW: ASSET-BASED RESTRICTION (Employees only)
        # Backend-level enforcement — frontend bypass panna mudiyathu
        # =================================================
        if user.role == "employee":
            active_assignments = get_active_assignments(user)

            # Rule 1: At least ONE active asset required
            if not active_assignments.exists():
                raise ValidationError({
                    "error": "No IT asset is currently assigned to you. "
                             "Please contact the IT Admin before creating a support ticket."
                })

            # Rule 2: Selected asset must belong to this employee
            selected_asset = serializer.validated_data.get("asset")
            if not selected_asset:
                raise ValidationError({
                    "error": "Please select the affected asset for this ticket."
                })
            if not active_assignments.filter(asset=selected_asset).exists():
                raise ValidationError({
                    "error": "Invalid asset. You can only create tickets "
                             "for assets assigned to you."
                })

            profile = getattr(user, 'employee_profile', None)
            dept = profile.department if profile else None
            ticket = serializer.save(employee=user, department=dept)
        else:
            # Admin/Technician — NO restriction
            ticket = serializer.save(employee=user)

        create_notification(
            user=ticket.employee,
            title="Ticket Created",
            message=f"Your ticket {ticket.ticket_number} has been created successfully.",
            notification_type="ticket_created",
            ticket=ticket,
        )
        admins = User.objects.filter(role="admin")
        for admin in admins:
            create_notification(
                user=admin,
                title="New Ticket",
                message=f"New ticket {ticket.ticket_number} from {ticket.employee.get_full_name()}: {ticket.title}",
                notification_type="ticket_created",
                ticket=ticket,
            )


class AIAnalyzeComplaintView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request):
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()

        if not title and not description:
            return Response(
                {'success': False, 'error': 'Please enter a title and description first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = ai_analyze_complaint(title, description)
        return Response(result, status=status.HTTP_200_OK)


class AITroubleshootView(APIView):
    permission_classes = [IsTechnician]

    def post(self, request):
        ticket_id = request.data.get('ticket_id')

        if not ticket_id:
            return Response(
                {'success': False, 'error': 'Ticket ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ticket = Ticket.objects.select_related(
                'category', 'assigned_technician', 'employee'
            ).get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Ticket not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if ticket.assigned_technician != request.user:
            return Response(
                {'success': False, 'error': 'You can only analyze tickets assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )

        result = ai_troubleshoot_ticket(ticket)
        return Response(result, status=status.HTTP_200_OK)