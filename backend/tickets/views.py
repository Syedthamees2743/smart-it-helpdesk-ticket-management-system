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
    TicketListSerializer, TicketDetailSerializer, 
    TicketCreateUpdateSerializer, AssignTicketSerializer,
    ChangeStatusSerializer, ReopenTicketSerializer, IssueCategorySerializer
)
from notifications.services import (
    send_ticket_assigned_notification, send_status_update_notification,
    send_ticket_resolved_notification, send_ticket_reopened_notification,
    send_ticket_closed_notification
)

User = get_user_model()


class TicketViewSet(viewsets.ModelViewSet):
    """
    Master ViewSet for Tickets with Workflow Actions.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ('ticket_number', 'title', 'description')
    filterset_fields = ('status', 'priority', 'department', 'category', 'employee', 'assigned_technician')
    ordering_fields = ('created_at', 'updated_at', 'priority', 'sla_deadline')
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list': return TicketListSerializer
        if self.action in ['create', 'update', 'partial_update']: return TicketCreateUpdateSerializer
        return TicketDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin': return Ticket.objects.all()
        elif user.role == 'employee': return Ticket.objects.filter(employee=user)
        elif user.role == 'technician': return Ticket.objects.filter(assigned_technician=user)
        return Ticket.objects.none()

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    def check_object_permissions(self, request, obj):
        user = request.user
        # Only allow specific actions based on role for object-level
        if request.method == 'DELETE':
            if user.role != 'admin':
                raise PermissionDenied("Only admins can delete tickets.")
        
        # Block employees from generic PUT/PATCH. They must use specific /reopen/ endpoint
        elif request.method in ['PUT', 'PATCH'] and user.role == 'employee':
             raise PermissionDenied("Employees cannot directly edit tickets.")

    def destroy(self, request, *args, **kwargs):
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.save()
        return Response({"message": f"Ticket {ticket.ticket_number} deleted (marked closed)."}, status=status.HTTP_200_OK)

    # ==========================================
    # WORKFLOW ACTIONS
    # ==========================================

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_ticket(self, request, pk=None):
        """
        POST /api/tickets/tickets/1/assign/
        Admin assigns a technician to a ticket.
        """
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can assign tickets.")
        
        ticket = self.get_object()
        if ticket.status == 'closed':
            raise ValidationError({"error": "Cannot assign a closed ticket."})

        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            technician = User.objects.get(id=serializer.validated_data['technician_id'], role='technician')
        except User.DoesNotExist:
            raise ValidationError({"error": "Invalid technician ID or user is not a technician."})

        old_status = ticket.status
        ticket.assigned_technician = technician
        ticket.assigned_by = request.user
        ticket.assigned_at = timezone.now()
        if ticket.status == 'open':
            ticket.status = 'assigned'
        ticket.save()

        send_ticket_assigned_notification(ticket)
        send_status_update_notification(ticket, old_status, ticket.status)

        return Response({"message": f"Ticket assigned to {technician.get_full_name()}", "status": ticket.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        POST /api/tickets/tickets/1/change-status/
        Technician or Admin changes status. Enforces workflow rules.
        """
        ticket = self.get_object()
        serializer = ChangeStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        old_status = ticket.status
        user = request.user

        # --- WORKFLOW VALIDATION ---
        if user.role == 'technician':
            allowed_transitions = {
                'assigned': 'in_progress',
                'in_progress': 'resolved',
                'reopened' : 'in_progress',
            }
            if old_status not in allowed_transitions or allowed_transitions[old_status] != new_status:
                raise ValidationError({"error": f"Technicians can only change: Assigned → In Progress → Resolved."})
            
            if new_status == 'resolved':
                ticket.resolved_at = timezone.now()
                send_ticket_resolved_notification(ticket)

        elif user.role == 'admin':
            # Admins can do anything, but let's record resolved_at if they resolve it
            if new_status == 'resolved' and not ticket.resolved_at:
                ticket.resolved_at = timezone.now()
        
        ticket.status = new_status
        ticket.save()

        send_status_update_notification(ticket, old_status, new_status)

        return Response({"message": f"Status changed to {new_status}", "status": ticket.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen_ticket(self, request, pk=None):
        """
        POST /api/tickets/tickets/1/reopen/
        Employee reopens a RESOLVED ticket. Requires a reason.
        """
        if request.user.role != 'employee':
            raise PermissionDenied("Only employees can reopen tickets.")
        
        ticket = self.get_object()
        if ticket.status != 'resolved':
            raise ValidationError({"error": "Only RESOLVED tickets can be reopened. Closed tickets cannot be reopened."})
        if ticket.employee != request.user:
            raise PermissionDenied("You can only reopen your own tickets.")

        serializer = ReopenTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = ticket.status
        ticket.status = 'reopened'
        ticket.reopen_reason = serializer.validated_data['reason']
        ticket.resolved_at = None # Reset resolution time
        ticket.save()

        send_ticket_reopened_notification(ticket)

        return Response({"message": "Ticket reopened successfully.", "status": ticket.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='confirm-resolution')
    def confirm_resolution(self, request, pk=None):
        """
        POST /api/tickets/tickets/1/confirm-resolution/
        Employee accepts the resolution. Ticket is CLOSED.
        """
        if request.user.role != 'employee':
            raise PermissionDenied("Only employees can confirm resolution.")
        
        ticket = self.get_object()
        if ticket.status != 'resolved':
            raise ValidationError({"error": "Only RESOLVED tickets can be confirmed."})
        if ticket.employee != request.user:
            raise PermissionDenied("You can only confirm your own tickets.")

        old_status = ticket.status
        ticket.status = 'closed'
        ticket.save()

        send_ticket_closed_notification(ticket)

        return Response({"message": "Resolution confirmed. Ticket closed.", "status": ticket.status}, status=status.HTTP_200_OK)

class IssueCategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Issue Categories
    """
    queryset = IssueCategory.objects.all()
    serializer_class = IssueCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

# --- TICKET COMMENT VIEWS ---

from .serializers import TicketCommentSerializer, TicketCommentListSerializer

class TicketCommentViewSet(viewsets.ModelViewSet):
    """
    Handles comments for tickets.
    Users can only comment on tickets they have access to.
    """
    serializer_class = TicketCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-created_at'] # Latest comments first

    def get_serializer_class(self):
        if self.action == 'list':
            return TicketCommentListSerializer
        return TicketCommentSerializer

    def get_queryset(self):
        # Only return comments for the ticket specified in the URL
        ticket_id = self.kwargs.get('ticket_pk') # comes from nested router
        return TicketComment.objects.filter(ticket_id=ticket_id)

    def perform_create(self, serializer):
        ticket_id = self.kwargs.get('ticket_pk')
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            raise ValidationError({"error": "Ticket not found."})

        user = self.request.user
        
        # Permission check: Can this user comment on this ticket?
        if user.role == 'employee' and ticket.employee != user:
            raise PermissionDenied("You can only comment on your own tickets.")
        elif user.role == 'technician' and ticket.assigned_technician != user:
            raise PermissionDenied("You can only comment on tickets assigned to you.")
        # Admins can comment on anything

        serializer.save(user=user, ticket=ticket)