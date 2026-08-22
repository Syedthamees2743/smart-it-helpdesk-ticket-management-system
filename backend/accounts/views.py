from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Q
from django.db import transaction
from .serializers import (
    AdminCreateUserSerializer,
    RegisterSerializer,
    UserSerializer,
    EmployeeProfileSerializer,
    TechnicianProfileSerializer,
)
from .models import EmployeeProfile, TechnicianProfile
from .permissions import IsAdmin, IsEmployee, IsTechnician

# For JWT Logout
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from rest_framework import viewsets
from .serializers import EmployeeProfileSerializer, TechnicianProfileSerializer

User = get_user_model()


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except KeyError:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ============================================================
# UserManagementView
# ============================================================

class UserManagementView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/  — List all users (admin only)
    POST /api/auth/users/  — Create a new user (admin only)
    """
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsAdmin]

    # ========== ADD THIS METHOD ==========
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        role = self.request.query_params.get('role', '')
        is_active = self.request.query_params.get('is_active', '')

        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(role__icontains=search)
            )

        if role:
            qs = qs.filter(role=role)

        if is_active:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs
    # ====================================

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return AdminCreateUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()

        except Exception as db_error:
            error_message = str(db_error).lower()

            if 'unique constraint' in error_message:
                if 'username' in error_message:
                    return Response(
                        {'success': False, 'error': 'A user with this username already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif 'email' in error_message:
                    return Response(
                        {'success': False, 'error': 'A user with this email already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif 'phone' in error_message:
                    return Response(
                        {'success': False, 'error': 'A user with this phone number already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {'success': False, 'error': 'A record with these details already exists. Please check username, email, and phone number.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            return Response(
                {'success': False, 'error': 'Failed to create user. Please check all fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send credential email for Employee/Technician
        raw_password = getattr(serializer, 'raw_password', None)
        role = getattr(serializer, 'created_user_role', None)

        email_sent = True
        email_warning = None

        if raw_password and role and role.lower() in ['employee', 'technician']:
            from notifications.credentials_email import send_new_user_credentials_email
            email_sent = send_new_user_credentials_email(user=user, raw_password=raw_password, role=role)
            if not email_sent:
                email_warning = "User created successfully, but failed to send the credential email."

        output_serializer = UserSerializer(user, context={'request': request})

        if email_sent:
            message = "User created successfully. Login credentials have been sent to the user's email."
        else:
            message = email_warning

        return Response(
            {'success': True, 'message': message, 'data': output_serializer.data},
            status=status.HTTP_201_CREATED
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user.id == request.user.id:
            return Response(
                {"error": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                try:
                    from tickets.models import Ticket
                    Ticket.objects.filter(employee=user).update(employee=request.user)
                    Ticket.objects.filter(assigned_technician=user).update(assigned_technician=None)
                except Exception:
                    pass

                try:
                    from assets.models import AssetAssignment
                    AssetAssignment.objects.filter(employee=user).delete()
                except Exception:
                    pass

                try:
                    from feedback.models import Feedback
                    Feedback.objects.filter(user=user).delete()
                    Feedback.objects.filter(employee=user).delete()
                except Exception:
                    pass

                EmployeeProfile.objects.filter(user=user).delete()
                TechnicianProfile.objects.filter(user=user).delete()

                try:
                    from notifications.models import Notification, NotificationPreference
                    Notification.objects.filter(user=user).delete()
                    NotificationPreference.objects.filter(user=user).delete()
                except Exception:
                    pass

                username = user.username
                user.delete()

        except Exception as e:
            return Response(
                {"error": f"Failed to delete user: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"success": True, "message": f"User '{username}' has been permanently deleted. Their tickets have been reassigned to you."},
            status=status.HTTP_200_OK
        )


class ToggleUserStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            status_msg = "activated" if user.is_active else "deactivated"
            return Response(
                {"message": f"User {user.username} has been {status_msg}."},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


# ==========================================
# OWN PROFILE UPDATE & CHANGE PASSWORD
# ==========================================


class UpdateOwnProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request):
        user = request.user
        allowed_fields = ['first_name', 'last_name', 'email', 'phone_number', 'profile_image']
        data = {field: request.data[field] for field in allowed_fields if field in request.data}

        if not data:
            return Response(
                {"success": False, "error": "No valid fields provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {"success": False, "error": {"detail": ["All three password fields are required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {"success": False, "error": {"current_password": ["Current password is incorrect."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"success": False, "error": {"confirm_password": ["New passwords do not match."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=user)
        except Exception as e:
            return Response(
                {"success": False, "error": {"new_password": list(e.messages)}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_password == new_password:
            return Response(
                {"success": False, "error": {"new_password": ["New password must be different from current password."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({"success": True, "message": "Password changed successfully."})


# ==========================================
# PROFILE VIEWS
# ==========================================


class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role == "admin":
            user_id = request.query_params.get("user_id")
            if user_id:
                try:
                    profile = EmployeeProfile.objects.get(user_id=user_id)
                    return Response(EmployeeProfileSerializer(profile).data)
                except EmployeeProfile.DoesNotExist:
                    return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            return Response(EmployeeProfileSerializer(profile).data)
        except EmployeeProfile.DoesNotExist:
            return Response({"error": "Employee profile not found for this user"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            serializer = EmployeeProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except EmployeeProfile.DoesNotExist:
            return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)


class TechnicianProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role == "admin":
            user_id = request.query_params.get("user_id")
            if user_id:
                try:
                    profile = TechnicianProfile.objects.get(user_id=user_id)
                    return Response(TechnicianProfileSerializer(profile).data)
                except TechnicianProfile.DoesNotExist:
                    return Response({"error": "Technician profile not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = TechnicianProfile.objects.get(user=request.user)
            return Response(TechnicianProfileSerializer(profile).data)
        except TechnicianProfile.DoesNotExist:
            return Response({"error": "Technician profile not found for this user"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            profile = TechnicianProfile.objects.get(user=request.user)
            serializer = TechnicianProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TechnicianProfile.DoesNotExist:
            return Response({"error": "Technician profile not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateProfileImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        if "profile_image" not in request.data:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.profile_image = request.data["profile_image"]
        request.user.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "put", "patch"]

    def get_queryset(self):
        return EmployeeProfile.objects.filter(user=self.request.user)


class TechnicianProfileViewSet(viewsets.ModelViewSet):
    serializer_class = TechnicianProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "put", "patch"]

    def get_queryset(self):
        return TechnicianProfile.objects.filter(user=self.request.user)


class UserRoleProfileView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'employee':
            try:
                return Response({"success": True, "data": EmployeeProfileSerializer(EmployeeProfile.objects.get(user=user)).data})
            except EmployeeProfile.DoesNotExist:
                return Response({"success": True, "data": None})
        elif user.role == 'technician':
            try:
                return Response({"success": True, "data": TechnicianProfileSerializer(TechnicianProfile.objects.get(user=user)).data})
            except TechnicianProfile.DoesNotExist:
                return Response({"success": True, "data": None})
        return Response({"success": True, "data": None, "message": "Admin has no role profile"})

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'employee':
            try:
                profile = EmployeeProfile.objects.get(user=user)
            except EmployeeProfile.DoesNotExist:
                profile = EmployeeProfile.objects.create(user=user)
            serializer = EmployeeProfileSerializer(profile, data=request.data, partial=True)
        elif user.role == 'technician':
            try:
                profile = TechnicianProfile.objects.get(user=user)
            except TechnicianProfile.DoesNotExist:
                profile = TechnicianProfile.objects.create(user=user)
            serializer = TechnicianProfileSerializer(profile, data=request.data, partial=True)
        else:
            return Response({"error": "No role profile for admin users"}, status=status.HTTP_400_BAD_REQUEST)

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'employee':
            EmployeeProfile.objects.get_or_create(user=instance)
        elif instance.role == 'technician':
            TechnicianProfile.objects.get_or_create(user=instance)