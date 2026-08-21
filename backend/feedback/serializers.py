from rest_framework import serializers
from .models import Feedback


class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ('ticket', 'rating', 'review')


class FeedbackListSerializer(serializers.ModelSerializer):
    ticket_number = serializers.StringRelatedField(source='ticket', read_only=True)
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    technician_name = serializers.StringRelatedField(source='ticket.assigned_technician', read_only=True)
    technician_id = serializers.SerializerMethodField()
    technician_department = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = (
            'id', 'ticket_number',
            'employee_name', 'employee_id', 'employee_department',
            'technician_name', 'technician_id', 'technician_department',
            'rating', 'review', 'created_at'
        )
        read_only_fields = fields

    def get_employee_id(self, obj):
        profile = getattr(obj.employee, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_employee_department(self, obj):
        profile = getattr(obj.employee, 'employee_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_technician_id(self, obj):
        tech = getattr(obj.ticket, 'assigned_technician', None)
        if not tech:
            return None
        profile = getattr(tech, 'technician_profile', None)
        return profile.technician_id if profile else None

    def get_technician_department(self, obj):
        tech = getattr(obj.ticket, 'assigned_technician', None)
        if not tech:
            return None
        profile = getattr(tech, 'technician_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None