from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.contrib.auth import get_user_model
from .models import Feedback
from .serializers import FeedbackCreateSerializer, FeedbackListSerializer
from tickets.models import Ticket
from notifications.services import create_notification 

User = get_user_model()


class FeedbackViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post']

    def get_serializer_class(self):
        if self.action == 'create':
            return FeedbackCreateSerializer
        return FeedbackListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Feedback.objects.all()
        elif user.role == 'technician':
            return Feedback.objects.filter(ticket__assigned_technician=user)
        elif user.role == 'employee':
            return Feedback.objects.filter(employee=user)
        return Feedback.objects.none()

    def perform_create(self, serializer):
        ticket_id = serializer.validated_data.get('ticket').id
        user = self.request.user

        # RULE 1: Only ticket owner can give feedback
        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            raise ValidationError({"error": "Ticket not found."})

        if ticket.employee != user:
            raise PermissionDenied("You can only submit feedback for your own tickets.")

        # RULE 2: Ticket must be CLOSED
        if ticket.status != 'closed':
            raise ValidationError({"error": "Feedback can only be submitted for CLOSED tickets."})

        # RULE 3: One feedback per ticket
        if Feedback.objects.filter(ticket=ticket, employee=user).exists():
            raise ValidationError({"error": "You have already submitted feedback for this ticket."})

        feedback = serializer.save(employee=user)

        rating = feedback.rating
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                title="New Feedback Received",
                message=f"{user.get_full_name()} gave {rating}/5 rating for ticket {ticket.ticket_number}.",
                notification_type="feedback_received",
                ticket=ticket,
            )

        if ticket.assigned_technician:
            create_notification(
                user=ticket.assigned_technician,
                title="New Feedback Received",
                message=f"{user.get_full_name()} gave {rating}/5 rating for ticket {ticket.ticket_number}.",
                notification_type="feedback_received",
                ticket=ticket,
            )