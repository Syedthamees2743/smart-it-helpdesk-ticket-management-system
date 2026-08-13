"""
Serializers for Notification Module
"""

from rest_framework import serializers
from .models import Notification


class NotificationListSerializer(serializers.ModelSerializer):
    """Used to list notifications for a user."""
    ticket_number = serializers.StringRelatedField(source='ticket', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'ticket', 'ticket_number', 'is_read', 'created_at')
        read_only_fields = fields


class NotificationUnreadCountSerializer(serializers.Serializer):
    """Returns the unread count."""
    unread_count = serializers.IntegerField()


class MarkReadSerializer(serializers.Serializer):
    """Validates mark-read request."""
    notification_id = serializers.IntegerField()