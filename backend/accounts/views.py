from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from .serializers import (
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
    permission_classes = [permissions.AllowAny]  # Public endpoint


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # request.user is automatically set by JWT authentication
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from the request body
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)

            # Blacklist the token
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


# ==========================================
# USER MANAGEMENT VIEWS (ADMIN ONLY)
# ==========================================


class UserManagementView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = RegisterSerializer
    permission_classes = [IsAdmin]

    # DAY 12: Enable backend search and filtering (inherits filter_backends from settings.py)
    search_fields = ("username", "first_name", "last_name", "email")
    filterset_fields = ("role", "is_active")
    ordering_fields = ("username", "first_name", "date_joined")
    ordering = ("-date_joined",)

    def get_serializer_class(self):
        if self.request.method == "GET":
            return UserSerializer
        return RegisterSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        # Instead of actually deleting from DB, we just deactivate the user
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(
            {"message": f"User {user.username} has been deactivated."},
            status=status.HTTP_200_OK,
        )


class ToggleUserStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active  # Toggle True/False
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
    """
    Any logged-in user can update their own first_name, last_name, email, phone_number.
    Uses request.user — no ID from frontend needed.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request):
        user = request.user
        # Only allow these 4 fields + profile_image
        allowed_fields = ['first_name', 'last_name', 'email', 'phone_number', 'profile_image']
        data = {}
        for field in allowed_fields:
            if field in request.data:
                data[field] = request.data[field]

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
    """
    Any logged-in user can change their own password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Validate all fields present
        if not current_password or not new_password or not confirm_password:
            return Response(
                {"success": False, "error": {"detail": ["All three password fields are required."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not user.check_password(current_password):
            return Response(
                {"success": False, "error": {"current_password": ["Current password is incorrect."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check new passwords match
        if new_password != confirm_password:
            return Response(
                {"success": False, "error": {"confirm_password": ["New passwords do not match."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password strength (Django's built-in validators)
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=user)
        except Exception as e:
            return Response(
                {"success": False, "error": {"new_password": list(e.messages)}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check not same as old password
        if current_password == new_password:
            return Response(
                {"success": False, "error": {"new_password": ["New password must be different from current password."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password (Django hashes it automatically)
        user.set_password(new_password)
        user.save()

        return Response({"success": True, "message": "Password changed successfully."})

# ==========================================
# PROFILE VIEWS
# ==========================================


class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Required for image upload

    def get(self, request):
        # If admin, they can pass ?user_id=X to see a specific profile
        if request.user.role == "admin":
            user_id = request.query_params.get("user_id")
            if user_id:
                try:
                    profile = EmployeeProfile.objects.get(user_id=user_id)
                    serializer = EmployeeProfileSerializer(profile)
                    return Response(serializer.data)
                except EmployeeProfile.DoesNotExist:
                    return Response(
                        {"error": "Employee profile not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        # Normal employee gets their own profile
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            serializer = EmployeeProfileSerializer(profile)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {"error": "Employee profile not found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def put(self, request):
        """Update employee profile"""
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            serializer = EmployeeProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {"error": "Employee profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class TechnicianProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role == "admin":
            user_id = request.query_params.get("user_id")
            if user_id:
                try:
                    profile = TechnicianProfile.objects.get(user_id=user_id)
                    serializer = TechnicianProfileSerializer(profile)
                    return Response(serializer.data)
                except TechnicianProfile.DoesNotExist:
                    return Response(
                        {"error": "Technician profile not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        try:
            profile = TechnicianProfile.objects.get(user=request.user)
            serializer = TechnicianProfileSerializer(profile)
            return Response(serializer.data)
        except TechnicianProfile.DoesNotExist:
            return Response(
                {"error": "Technician profile not found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def put(self, request):
        """Update technician profile"""
        try:
            profile = TechnicianProfile.objects.get(user=request.user)
            serializer = TechnicianProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except TechnicianProfile.DoesNotExist:
            return Response(
                {"error": "Technician profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class UpdateProfileImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        user = request.user
        # Get the image from the request (key should be 'profile_image')
        if "profile_image" not in request.data:
            return Response(
                {"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        user.profile_image = request.data["profile_image"]
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# UPGRADED PROFILE VIEWSETS (CORRECTED)
# ==========================================


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    Employee can view and update their OWN profile.
    """

    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # FIX 1: Explicitly tell Django which HTTP methods are allowed.
    # We remove 'post' (create) and 'delete' (destroy).
    http_method_names = ["get", "put", "patch"]

    # FIX 2: Only return the profile of the logged-in user.
    def get_queryset(self):
        return EmployeeProfile.objects.filter(user=self.request.user)


class TechnicianProfileViewSet(viewsets.ModelViewSet):
    """
    Technician can view and update their OWN profile.
    """

    serializer_class = TechnicianProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Only allow viewing and updating
    http_method_names = ["get", "put", "patch"]

    def get_queryset(self):
        return TechnicianProfile.objects.filter(user=self.request.user)


class UserRoleProfileView(APIView):
    """
    Admin can view and update employee/technician profile fields
    like department, employee_id, designation, specialization.
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'employee':
            try:
                profile = EmployeeProfile.objects.get(user=user)
                return Response({"success": True, "data": EmployeeProfileSerializer(profile).data})
            except EmployeeProfile.DoesNotExist:
                return Response({"success": True, "data": None})
        elif user.role == 'technician':
            try:
                profile = TechnicianProfile.objects.get(user=user)
                return Response({"success": True, "data": TechnicianProfileSerializer(profile).data})
            except TechnicianProfile.DoesNotExist:
                return Response({"success": True, "data": None})
        else:
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
                # Auto-create if missing
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

    
# ==========================================
# AUTO-CREATE PROFILE ON USER CREATION
# ==========================================

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'employee':
            EmployeeProfile.objects.get_or_create(user=instance)
        elif instance.role == 'technician':
            TechnicianProfile.objects.get_or_create(user=instance)