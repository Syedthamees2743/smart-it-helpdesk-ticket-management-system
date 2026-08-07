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
    department_name = serializers.StringRelatedField(source='department', read_only=True)
    category_name = serializers.StringRelatedField(source='category', read_only=True)
    technician_name = serializers.StringRelatedField(source='assigned_technician', read_only=True)
    
    # Dynamic SLA Status Field (Calculated on the fly, not stored in DB)
    sla_status = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            'id', 'ticket_number', 'title', 'employee_name', 'department_name', 
            'category_name', 'technician_name', 'priority', 'status', 
            'sla_deadline', 'sla_status', 'created_at'
        )

    def get_sla_status(self, obj):
        """Calculates SLA status dynamically"""
        if not obj.sla_deadline:
            return "Pending"
        
        now = timezone.now()
        
        # If ticket is resolved or closed, check if it was done before deadline
        if obj.status in ['resolved', 'closed'] and obj.resolved_at:
            if obj.resolved_at <= obj.sla_deadline:
                return "Met"
            else:
                return "Breached"
        
        # If ticket is still open/assigned/in_progress, check if deadline is passed
        if now > obj.sla_deadline:
            return "Breached"
            
        return "Pending"


class TicketDetailSerializer(serializers.ModelSerializer):
    """Used for viewing full ticket details."""
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)
    department_name = serializers.StringRelatedField(source='department', read_only=True)
    category_name = serializers.StringRelatedField(source='category', read_only=True)
    technician_name = serializers.StringRelatedField(source='assigned_technician', read_only=True)
    assigned_by_name = serializers.StringRelatedField(source='assigned_by', read_only=True)
    sla_status = serializers.SerializerMethodField()
    
    # Resolution time in hours (calculated)
    resolution_time_hours = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('ticket_number', 'employee', 'created_at', 'updated_at', 'resolved_at', 'sla_deadline')

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
            return round(diff.total_seconds() / 3600, 2) # Convert seconds to hours
        return None


class TicketCreateUpdateSerializer(serializers.ModelSerializer):
    """Used for creating a ticket."""
    class Meta:
        model = Ticket
        fields = ('title', 'description', 'department', 'category', 'screenshot', 'priority')


# --- ACTION SERIALIZERS ---

class AssignTicketSerializer(serializers.Serializer):
    """Serializer specifically for the Assign Action"""
    technician_id = serializers.IntegerField()

class ChangeStatusSerializer(serializers.Serializer):
    """Serializer specifically for changing status"""
    status = serializers.ChoiceField(choices=['assigned', 'in_progress', 'resolved', 'closed'])

class ReopenTicketSerializer(serializers.Serializer):
    """Serializer specifically for reopening a ticket"""
    reason = serializers.CharField(max_length=500, write_only=True)


# --- TICKET COMMENT SERIALIZERS ---

class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer to create a comment"""
    user_name = serializers.StringRelatedField(source='user', read_only=True)

    class Meta:
        model = TicketComment
        fields = '__all__'
        read_only_fields = ('id', 'ticket','user', 'user_name', 'created_at')


class TicketCommentListSerializer(serializers.ModelSerializer):
    """Serializer to list comments (optimized)"""
    user_name = serializers.StringRelatedField(source='user', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = TicketComment
        fields = ('id', 'user_name', 'user_role', 'comment', 'created_at')

class IssueCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = IssueCategory
        fields = "__all__"