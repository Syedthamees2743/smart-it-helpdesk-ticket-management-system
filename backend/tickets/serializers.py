"""
Serializers for Ticket Module
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Ticket, IssueCategory
from .models import TicketComment
import datetime


class TicketListSerializer(serializers.ModelSerializer):
    """Used for listing tickets."""
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_name = serializers.StringRelatedField(source='category', read_only=True)
    technician_name = serializers.StringRelatedField(source='assigned_technician', read_only=True)
    technician_id = serializers.SerializerMethodField()
    technician_department = serializers.SerializerMethodField()
    technician_specialization = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            'id', 'ticket_number', 'title',
            'employee_name', 'employee_id', 'employee_department',
            'department_name',
            'category_name',
            'technician_name', 'technician_id', 'technician_department', 'technician_specialization',
            'priority', 'status',
            'sla_deadline', 'sla_status', 'created_at'
        )

    def get_employee_id(self, obj):
        profile = getattr(obj.employee, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_employee_department(self, obj):
        if obj.department:
            return obj.department.name
        profile = getattr(obj.employee, 'employee_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_department_name(self, obj):
        return self.get_employee_department(obj)

    def get_technician_id(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        return profile.technician_id if profile else None

    def get_technician_department(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_technician_specialization(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        return profile.specialization if profile else None

    def get_sla_status(self, obj):
        if not obj.sla_deadline:
            return "Pending"
        now = timezone.now()
        if obj.status in ['resolved', 'closed'] and obj.resolved_at:
            if obj.resolved_at <= obj.sla_deadline:
                return "Met"
            else:
                return "Breached"
        if now > obj.sla_deadline:
            return "Breached"
        return "Pending"


class TicketDetailSerializer(serializers.ModelSerializer):
    """Used for viewing full ticket details."""
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_name = serializers.StringRelatedField(source='category', read_only=True)
    technician_name = serializers.StringRelatedField(source='assigned_technician', read_only=True)
    technician_id = serializers.SerializerMethodField()
    technician_department = serializers.SerializerMethodField()
    technician_specialization = serializers.SerializerMethodField()
    assigned_by_name = serializers.StringRelatedField(source='assigned_by', read_only=True)
    sla_status = serializers.SerializerMethodField()
    resolution_time_hours = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('ticket_number', 'employee', 'created_at', 'updated_at', 'resolved_at', 'sla_deadline')

    def get_employee_id(self, obj):
        profile = getattr(obj.employee, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_employee_department(self, obj):
        if obj.department:
            return obj.department.name
        profile = getattr(obj.employee, 'employee_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_department_name(self, obj):
        return self.get_employee_department(obj)

    def get_technician_id(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        return profile.technician_id if profile else None

    def get_technician_department(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_technician_specialization(self, obj):
        if not obj.assigned_technician:
            return None
        profile = getattr(obj.assigned_technician, 'technician_profile', None)
        return profile.specialization if profile else None

    def get_sla_status(self, obj):
        if not obj.sla_deadline: return "Pending"
        now = timezone.now()
        if obj.status in ['resolved', 'closed'] and obj.resolved_at:
            return "Met" if obj.resolved_at <= obj.sla_deadline else "Breached"
        if now > obj.sla_deadline: return "Breached"
        return "Pending"

    def get_resolution_time_hours(self, obj):
        if obj.created_at and obj.resolved_at:
            diff = obj.resolved_at - obj.created_at
            return round(diff.total_seconds() / 3600, 2)
        return None


class TicketCreateUpdateSerializer(serializers.ModelSerializer):
    """Used for creating a ticket."""
    class Meta:
        model = Ticket
        fields = ('title', 'description', 'department', 'category', 'screenshot', 'priority')


# --- ACTION SERIALIZERS ---

class AssignTicketSerializer(serializers.Serializer):
    technician_id = serializers.IntegerField()

class ChangeStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['assigned', 'in_progress', 'resolved', 'closed'])

class ReopenTicketSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, write_only=True)


# --- TICKET COMMENT SERIALIZERS ---

class TicketCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source='user', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_employee_id = serializers.SerializerMethodField()
    user_technician_id = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = '__all__'
        read_only_fields = ('id', 'ticket', 'user', 'created_at')

    def get_user_employee_id(self, obj):
        profile = getattr(obj.user, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_user_technician_id(self, obj):
        profile = getattr(obj.user, 'technician_profile', None)
        return profile.technician_id if profile else None


class TicketCommentListSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source='user', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    user_employee_id = serializers.SerializerMethodField()
    user_technician_id = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = ('id', 'user_name', 'user_role', 'user_employee_id', 'user_technician_id', 'comment', 'created_at')

    def get_user_employee_id(self, obj):
        profile = getattr(obj.user, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_user_technician_id(self, obj):
        profile = getattr(obj.user, 'technician_profile', None)
        return profile.technician_id if profile else None


class IssueCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCategory
        fields = "__all__"