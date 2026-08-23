from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import EmployeeProfile, TechnicianProfile, AccountActivation
from departments.models import Department
from django.db.models import Max
import re

User = get_user_model()

def generate_employee_id():
    """
    Auto-generates next Employee ID in format EMP-001, EMP-002, etc.
    """
    from .models import EmployeeProfile
    
    last_profile = EmployeeProfile.objects.order_by('-id').first()
    
    if last_profile and last_profile.employee_id:
        # Extract number from EMP-001 format
        match = re.search(r'(\d+)$', last_profile.employee_id)
        if match:
            next_num = int(match.group(1)) + 1
            return f"EMP-{next_num:03d}"
    
    return "EMP-001"


def generate_technician_id():
    """
    Auto-generates next Technician ID in format TECH-001, TECH-002, etc.
    """
    from .models import TechnicianProfile
    
    last_profile = TechnicianProfile.objects.order_by('-id').first()
    
    if last_profile and last_profile.technician_id:
        # Extract number from TECH-001 format
        match = re.search(r'(\d+)$', last_profile.technician_id)
        if match:
            next_num = int(match.group(1)) + 1
            return f"TECH-{next_num:03d}"
    
    return "TECH-001"

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
            'profile_image', 'is_active', 'created_at', 'account_status',
            'employee_id', 'employee_department',
            'technician_id', 'technician_department',
            'designation', 'specialization',
        )
        read_only_fields = ('id', 'created_at')

    def get_employee_id(self, obj):
        try:
            profile = obj.employee_profile
            return profile.employee_id if profile else None
        except Exception:
            return None

    def get_employee_department(self, obj):
        try:
            profile = obj.employee_profile
            return profile.department.name if profile and profile.department else None
        except Exception:
            return None

    def get_technician_id(self, obj):
        try:
            profile = obj.technician_profile
            return profile.technician_id if profile else None
        except Exception:
            return None

    def get_technician_department(self, obj):
        try:
            profile = obj.technician_profile
            return profile.department.name if profile and profile.department else None
        except Exception:
            return None

    def get_designation(self, obj):
        try:
            profile = obj.employee_profile
            return profile.designation if profile else None
        except Exception:
            return None

    def get_specialization(self, obj):
        try:
            profile = obj.technician_profile
            return profile.specialization if profile else None
        except Exception:
            return None


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


# ============================================================
# EMPLOYEE SIGNUP SERIALIZER
# ============================================================

class EmployeeSignupSerializer(serializers.Serializer):
    """
    Public signup for employees.
    Backend enforces role = 'employee'.
    No password — user sets password during activation.
    Creates User with account_status='pending' and is_active=False.
    Also creates EmployeeProfile with department, employee_id, designation.
    """
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, default='')
    username = serializers.CharField(max_length=150, required=True)
    # REMOVED: employee_id - now auto-generated
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True
    )
    designation = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'username', 'department', 'designation'
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_department(self, value):
        if not Department.objects.filter(id=value.id if hasattr(value, 'id') else value).exists():
            raise serializers.ValidationError("Selected department does not exist.")
        return value

    def create(self, validated_data):
        # Auto-generate Employee ID
        employee_id = generate_employee_id()
        
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role='employee',
            account_status='pending',
            is_active=False,
        )
        user.set_unusable_password()
        user.save()

        EmployeeProfile.objects.update_or_create(
            user=user,
            defaults={
                'employee_id': employee_id,  # Auto-generated
                'department': validated_data.get('department'),
                'designation': validated_data.get('designation', ''),
            }
        )

        return user
    


# ============================================================
# TECHNICIAN SIGNUP SERIALIZER
# ============================================================

class TechnicianSignupSerializer(serializers.Serializer):
    """
    Public signup for technicians.
    Backend enforces role = 'technician'.
    No password — user sets password during activation.
    Creates User with account_status='pending' and is_active=False.
    Also creates TechnicianProfile with department, technician_id, specialization.
    """
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, default='')
    username = serializers.CharField(max_length=150, required=True)
    # REMOVED: technician_id - now auto-generated
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True
    )
    specialization = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'username', 'department', 'specialization'
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_department(self, value):
        if not Department.objects.filter(id=value.id if hasattr(value, 'id') else value).exists():
            raise serializers.ValidationError("Selected department does not exist.")
        return value

    def create(self, validated_data):
        # Auto-generate Technician ID
        technician_id = generate_technician_id()
        
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            role='technician',
            account_status='pending',
            is_active=False,
        )
        user.set_unusable_password()
        user.save()

        TechnicianProfile.objects.update_or_create(
            user=user,
            defaults={
                'technician_id': technician_id,  # Auto-generated
                'department': validated_data.get('department'),
                'specialization': validated_data.get('specialization', ''),
            }
        )

        return user


# ============================================================
# ACTIVATION SERIALIZER
# ============================================================

class ActivateAccountSerializer(serializers.Serializer):
    """
    Validates password for account activation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        error_messages={
            'min_length': 'Password must be at least 8 characters.',
            'required': 'Password is required.',
            'blank': 'Password is required.'
        }
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            'required': 'Please confirm your password.',
            'blank': 'Please confirm your password.'
        }
    )

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({'password2': ['Passwords do not match.']})
        return attrs

    def validate_password(self, value):
        try:
            validate_password(value)
        except Exception as e:
            errors = [str(err) for err in e.messages]
            raise serializers.ValidationError(errors)
        return value


# ============================================================
# PENDING USER SERIALIZER
# ============================================================

class PendingUserSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for pending user list.
    Includes profile data.
    """
    employee_id = serializers.SerializerMethodField()
    technician_id = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    submitted_at = serializers.DateTimeField(source='created_at', read_only=True)
    account_status_display = serializers.CharField(source='get_account_status_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'phone_number', 'role', 'role_display', 'account_status', 'account_status_display',
            'submitted_at',
            'employee_id', 'technician_id', 'department_name',
            'designation', 'specialization',
        ]

    def get_employee_id(self, obj):
        try:
            profile = obj.employee_profile
            return profile.employee_id if profile else None
        except Exception:
            return None

    def get_technician_id(self, obj):
        try:
            profile = obj.technician_profile
            return profile.technician_id if profile else None
        except Exception:
            return None

    def get_department_name(self, obj):
        try:
            profile = getattr(obj, 'employee_profile', None) or getattr(obj, 'technician_profile', None)
            return profile.department.name if profile and profile.department else None
        except Exception:
            return None

    def get_designation(self, obj):
        try:
            profile = obj.employee_profile
            return profile.designation if profile else None
        except Exception:
            return None

    def get_specialization(self, obj):
        try:
            profile = obj.technician_profile
            return profile.specialization if profile else None
        except Exception:
            return None