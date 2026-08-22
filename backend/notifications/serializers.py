from rest_framework import serializers
from .models import Notification
from .models import NotificationPreference


class NotificationListSerializer(serializers.ModelSerializer):
    ticket_number = serializers.StringRelatedField(source='ticket', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'notification_type', 'ticket', 'ticket_number', 'is_read', 'created_at')
        read_only_fields = fields


class NotificationUnreadCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField()


class MarkReadSerializer(serializers.Serializer):
    notification_id = serializers.IntegerField()


class NotificationPreferenceSerializer(serializers.ModelSerializer):

    class Meta:
        model = NotificationPreference
        fields = (
            'email_notifications',
            'ticket_assignment',
            'ticket_status_update',
            'comment_notifications',
            'sla_alerts',
            'asset_notifications',
        )