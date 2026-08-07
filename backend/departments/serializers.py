"""
Serializers for Department Module
"""

from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """
    Converts Department model data to JSON and vice-versa.
    """
    class Meta:
        model = Department
        fields = '__all__' # Includes id, name, description, status, created_at
        read_only_fields = ('created_at',) # Admin shouldn't manually set creation date