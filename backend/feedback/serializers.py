from rest_framework import serializers
from .models import Feedback

class FeedbackCreateSerializer(serializers.ModelSerializer):
    """Used when an employee submits feedback"""
    class Meta:
        model = Feedback
        fields = ('ticket', 'rating', 'review')

class FeedbackListSerializer(serializers.ModelSerializer):
    """Used to list feedback (shows names instead of IDs)"""
    ticket_number = serializers.StringRelatedField(source='ticket', read_only=True)
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    technician_name = serializers.StringRelatedField(source='ticket.assigned_technician', read_only=True)

    class Meta:
        model = Feedback
        fields = ('id', 'ticket_number', 'employee_name', 'technician_name', 'rating', 'review', 'created_at')
        read_only_fields = fields