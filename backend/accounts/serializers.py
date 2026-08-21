from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmployeeProfile, TechnicianProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone_number')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    employee_id = serializers.SerializerMethodField(read_only=True)
    employee_department = serializers.SerializerMethodField(read_only=True)
    technician_id = serializers.SerializerMethodField(read_only=True)
    technician_department = serializers.SerializerMethodField(read_only=True)
    designation = serializers.SerializerMethodField(read_only=True)
    specialization = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number',
            'profile_image', 'is_active', 'created_at',
            'employee_id', 'employee_department',
            'technician_id', 'technician_department',
            'designation', 'specialization',
        )
        read_only_fields = ('id', 'created_at')

    def get_employee_id(self, obj):
        profile = getattr(obj, 'employee_profile', None)
        return profile.employee_id if profile else None

    def get_employee_department(self, obj):
        profile = getattr(obj, 'employee_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_technician_id(self, obj):
        profile = getattr(obj, 'technician_profile', None)
        return profile.technician_id if profile else None

    def get_technician_department(self, obj):
        profile = getattr(obj, 'technician_profile', None)
        if profile and profile.department:
            return profile.department.name
        return None

    def get_designation(self, obj):
        profile = getattr(obj, 'employee_profile', None)
        return profile.designation if profile else None

    def get_specialization(self, obj):
        profile = getattr(obj, 'technician_profile', None)
        return profile.specialization if profile else None


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)

    class Meta:
        model = EmployeeProfile
        fields = ('id', 'user', 'employee_id', 'department', 'department_name', 'designation', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class TechnicianProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)

    class Meta:
        model = TechnicianProfile
        fields = ('id', 'user', 'technician_id', 'department', 'department_name', 'specialization', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')