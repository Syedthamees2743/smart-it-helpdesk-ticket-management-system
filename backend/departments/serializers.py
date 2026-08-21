
from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    department_type_display = serializers.CharField(
        source='get_department_type_display', 
        read_only=True
    )
    
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('created_at',)