"""
Views for Ticket Module - Complete Workflow
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model

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
from notifications.services import (
    send_ticket_assigned_notification,
    send_status_update_notification,
    send_ticket_resolved_notification,
    send_ticket_reopened_notification,
    send_ticket_closed_notification,
    create_notification,  # DAY 10: Added in-app notification helper
)

User = get_user_model()


class TicketViewSet(viewsets.ModelViewSet):
    """
    Master ViewSet for Tickets with Workflow Actions.
    """

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
        ticket = serializer.save(employee=self.request.user)

        # DAY 10: Notify employee
        create_notification(
            user=ticket.employee,
            title="Ticket Created",
            message=f"Your ticket {ticket.ticket_number} has been created successfully.",
            notification_type="ticket_created",
            ticket=ticket,
        )
        # DAY 10: Notify all admins
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

    # ==========================================
    # WORKFLOW ACTIONS
    # ==========================================

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

        # Email notifications (existing)
        send_ticket_assigned_notification(ticket)
        send_status_update_notification(ticket, old_status, ticket.status)

        # DAY 10: In-app notification for technician
        create_notification(
            user=technician,
            title="Ticket Assigned",
            message=f"You have been assigned ticket {ticket.ticket_number}: {ticket.title}",
            notification_type="ticket_assigned",
            ticket=ticket,
        )
        # DAY 10: In-app notification for employee
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
                    {
                        "error": f"Technicians can only change: Assigned → In Progress → Resolved."
                    }
                )

            if new_status == "resolved":
                ticket.resolved_at = timezone.now()
                send_ticket_resolved_notification(ticket)

                # DAY 10: In-app notification for employee when resolved
                create_notification(
                    user=ticket.employee,
                    title="Ticket Resolved",
                    message=f"Your ticket {ticket.ticket_number} has been resolved. Please review and confirm.",
                    notification_type="ticket_resolved",
                    ticket=ticket,
                )

            # DAY 10: In-app notification when technician starts working
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
                {
                    "error": "Only RESOLVED tickets can be reopened. Closed tickets cannot be reopened."
                }
            )
        if ticket.employee != request.user:
            raise PermissionDenied("You can only reopen your own tickets.")

        serializer = ReopenTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = ticket.status
        ticket.status = "reopened"
        ticket.reopen_reason = serializer.validated_data["reason"]
        ticket.resolved_at = None
        ticket.save()

        # Email notification (existing)
        send_ticket_reopened_notification(ticket)

        # DAY 10: In-app notification for all admins
        admins = User.objects.filter(role="admin")
        for admin in admins:
            create_notification(
                user=admin,
                title="Ticket Reopened",
                message=f"Ticket {ticket.ticket_number} has been reopened by {ticket.employee.get_full_name()}.",
                notification_type="ticket_reopened",
                ticket=ticket,
            )
        # DAY 10: In-app notification for assigned technician
        if ticket.assigned_technician:
            create_notification(
                user=ticket.assigned_technician,
                title="Ticket Reopened",
                message=f"Ticket {ticket.ticket_number} has been reopened by the employee.",
                notification_type="ticket_reopened",
                ticket=ticket,
            )

        return Response(
            {"message": "Ticket reopened successfully.", "status": ticket.status},
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

        # Email notification (existing)
        send_ticket_closed_notification(ticket)

        # DAY 10: In-app notification for technician
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


# --- TICKET COMMENT VIEWS ---

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
        ticket_id = self.kwargs.get("ticket_pk")
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            raise ValidationError({"error": "Ticket not found."})

        user = self.request.user

        if user.role == "employee" and ticket.employee != user:
            raise PermissionDenied("You can only comment on your own tickets.")
        elif user.role == "technician" and ticket.assigned_technician != user:
            raise PermissionDenied("You can only comment on tickets assigned to you.")

        comment = serializer.save(user=user, ticket=ticket)

        # DAY 10: Notify the other party about the comment
        if user.role == "technician" and ticket.employee:
            create_notification(
                user=ticket.employee,
                title="New Comment",
                message=f"Technician added a comment to your ticket {ticket.ticket_number}.",
                notification_type="ticket_comment",
                ticket=ticket,
            )
        elif user.role == "employee" and ticket.assigned_technician:
            create_notification(
                user=ticket.assigned_technician,
                title="New Comment",
                message=f"Employee added a comment to ticket {ticket.ticket_number}.",
                notification_type="ticket_comment",
                ticket=ticket,
            )
        elif user.role == "admin":
            # If admin comments, notify both employee and technician
            if ticket.employee and ticket.employee != user:
                create_notification(
                    user=ticket.employee,
                    title="New Comment",
                    message=f"A comment was added to your ticket {ticket.ticket_number}.",
                    notification_type="ticket_comment",
                    ticket=ticket,
                )
            if ticket.assigned_technician and ticket.assigned_technician != user:
                create_notification(
                    user=ticket.assigned_technician,
                    title="New Comment",
                    message=f"A comment was added to ticket {ticket.ticket_number}.",
                    notification_type="ticket_comment",
                    ticket=ticket,
                )
