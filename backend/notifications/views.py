"""
Views for Notification Module
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Notification
from .serializers import NotificationListSerializer


class NotificationViewSet(viewsets.GenericViewSet):
    """
    Users can only see their OWN notifications.
    No create/update/delete — notifications are created by the system.
    """
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # CRITICAL: Only return notifications for the logged-in user
        return Notification.objects.filter(user=self.request.user)

    def list(self, request):
        """GET /api/notifications/ — List all notifications for current user."""
        queryset = self.get_queryset()
        # Support ?unread=true filter
        unread_only = request.query_params.get('unread')
        if unread_only and unread_only.lower() in ('true', '1', 'yes'):
            queryset = queryset.filter(is_read=False)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "count": queryset.count(),
            "results": serializer.data
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """GET /api/notifications/unread-count/ — Get unread notification count."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({
            "success": True,
            "unread_count": count
        })

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """POST /api/notifications/{id}/mark-read/ — Mark one notification as read."""
        try:
            notification = self.get_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response(
                {"success": False, "error": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({"success": True, "message": "Notification marked as read."})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """POST /api/notifications/mark-all-read/ — Mark all notifications as read."""
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({
            "success": True,
            "message": f"{updated} notification(s) marked as read."
        })