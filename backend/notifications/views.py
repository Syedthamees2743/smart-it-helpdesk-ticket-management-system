"""
Views for Notification Module
"""
from accounts.permissions import IsAdmin
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import APIView, action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Notification, NotificationPreference
from .serializers import NotificationListSerializer, NotificationPreferenceSerializer
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

class SettingsView(APIView):
    """
    GET  /api/notifications/settings/  — Returns account info + notification preferences
    PATCH /api/notifications/settings/ — Updates notification preferences only
    Uses request.user exclusively. No user ID from frontend.
    Auto-creates preferences on first GET.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Auto-create preferences if they don't exist
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)

        # Serialize preferences
        pref_data = NotificationPreferenceSerializer(prefs).data

        # Build account info (read-only)
        account_data = {
            'username': user.username,
            'email': user.email,
            'role': user.get_role_display(),
            'role_key': user.role,
            'is_active': user.is_active,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }

        return Response({
            'success': True,
            'data': {
                'account': account_data,
                'preferences': pref_data,
            }
        })

    def patch(self, request):
        user = request.user

        # Get or create preferences
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)

        # Only allow preference fields — ignore anything else sent
        allowed = [
            'email_notifications',
            'ticket_assignment',
            'ticket_status_update',
            'comment_notifications',
            'sla_alerts',
            'asset_notifications',
        ]
        data = {}
        for field in allowed:
            if field in request.data:
                data[field] = request.data[field]

        if not data:
            return Response(
                {'success': False, 'error': 'No valid preference fields provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = NotificationPreferenceSerializer(prefs, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Notification preferences updated successfully.',
                'data': serializer.data
            })
        return Response(
            {'success': False, 'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminUserPreferencesView(APIView):
    """
    GET    /api/notifications/admin/preferences/<user_id>/  — Admin fetches a user's preferences
    PATCH  /api/notifications/admin/preferences/<user_id>/  — Admin updates a user's preferences
    Only accessible by admins. Uses URL user_id but verifies admin permission first.
    """
    permission_classes = [IsAdmin]

    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Auto-create preferences if missing
        prefs, _ = NotificationPreference.objects.get_or_create(user=target_user)

        return Response({
            'success': True,
            'data': {
                'user_id': target_user.id,
                'username': target_user.username,
                'full_name': target_user.get_full_name(),
                'role': target_user.get_role_display(),
                'preferences': NotificationPreferenceSerializer(prefs).data,
            }
        })

    def patch(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create preferences
        prefs, _ = NotificationPreference.objects.get_or_create(user=target_user)

        # Only allow preference fields
        allowed = [
            'email_notifications',
            'ticket_assignment',
            'ticket_status_update',
            'comment_notifications',
            'sla_alerts',
            'asset_notifications',
        ]
        data = {}
        for field in allowed:
            if field in request.data:
                data[field] = request.data[field]

        if not data:
            return Response(
                {'success': False, 'error': 'No valid preference fields provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = NotificationPreferenceSerializer(prefs, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': f'Notification preferences updated for {target_user.get_full_name() or target_user.username}.',
                'data': serializer.data
            })
        return Response(
            {'success': False, 'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )