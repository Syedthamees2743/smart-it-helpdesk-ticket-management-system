from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmployeeProfile, TechnicianProfile

# Get the custom user model
User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone_number')

    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # Remove password2 as it's not a field in the User model
        validated_data.pop('password2')
        
        # Create the user using Django's built-in create_user method (hashes password automatically)
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'profile_image', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at') # These fields cannot be changed by the user


class EmployeeProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Shows full user details inside profile

    class Meta:
        model = EmployeeProfile
        fields = ('id', 'user', 'employee_id', 'department', 'designation', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class TechnicianProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TechnicianProfile
        fields = ('id', 'user', 'technician_id', 'department', 'specialization', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')