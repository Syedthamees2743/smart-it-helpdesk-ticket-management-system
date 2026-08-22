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
        return profile.department.name if profile and profile.department else None

    def get_technician_id(self, obj):
        profile = getattr(obj, 'technician_profile', None)
        return profile.technician_id if profile else None

    def get_technician_department(self, obj):
        profile = getattr(obj, 'technician_profile', None)
        return profile.department.name if profile and profile.department else None

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


class AdminCreateUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        error_messages={
            'blank': 'Email is required.',
            'required': 'Email is required.',
            'invalid': 'Please enter a valid email address.',
        }
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
        allow_blank=False,
        min_length=8,
        error_messages={
            'min_length': 'Password must be at least 8 characters long.',
            'blank': 'Password is required.',
            'required': 'Password is required.'
        }
    )

    password2 = serializers.CharField(
        write_only=True,
        required=True,
        allow_blank=False,
        min_length=8,
        error_messages={
            'blank': 'Please confirm your password.',
            'required': 'Please confirm your password.'
        }
    )

    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'email',
            'phone_number', 'role', 'password', 'password2', 'is_active',
        ]
        extra_kwargs = {
            'username': {
                'required': True,
                'allow_blank': False,
                'error_messages': {'blank': 'Username is required.', 'required': 'Username is required.'}
            },
            'role': {
                'required': True,
                'allow_blank': False,
                'error_messages': {'blank': 'Role is required.', 'required': 'Role is required.'}
            }
        }

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if value and User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        if password and password2 and password != password2:
            raise serializers.ValidationError({'password2': ['Passwords do not match.']})
        return attrs

    def create(self, validated_data):
        raw_password = validated_data.pop('password')
        validated_data.pop('password2', None)
        role = validated_data.get('role', 'employee')

        user = User.objects.create_user(password=raw_password, **validated_data)

        self.raw_password = raw_password
        self.created_user_role = role

        return user