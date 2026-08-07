from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, EmployeeProfileSerializer, TechnicianProfileSerializer
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
    permission_classes = [permissions.AllowAny] # Public endpoint


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
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        except TokenError:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# USER MANAGEMENT VIEWS (ADMIN ONLY)
# ==========================================

class UserManagementView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = RegisterSerializer # Reusing register serializer for creation
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        # Use UserSerializer (which doesn't have password fields) for listing
        if self.request.method == 'GET':
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
        return Response({"message": f"User {user.username} has been deactivated."}, status=status.HTTP_200_OK)


class ToggleUserStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active # Toggle True/False
            user.save()
            status_msg = "activated" if user.is_active else "deactivated"
            return Response({"message": f"User {user.username} has been {status_msg}."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# PROFILE VIEWS
# ==========================================

class EmployeeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Required for image upload

    def get(self, request):
        # If admin, they can pass ?user_id=X to see a specific profile
        if request.user.role == 'admin':
            user_id = request.query_params.get('user_id')
            if user_id:
                try:
                    profile = EmployeeProfile.objects.get(user_id=user_id)
                    serializer = EmployeeProfileSerializer(profile)
                    return Response(serializer.data)
                except EmployeeProfile.DoesNotExist:
                    return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Normal employee gets their own profile
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
            serializer = EmployeeProfileSerializer(profile)
            return Response(serializer.data)
        except EmployeeProfile.DoesNotExist:
            return Response({"error": "Employee profile not found for this user"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        """Update employee profile"""
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
        if request.user.role == 'admin':
            user_id = request.query_params.get('user_id')
            if user_id:
                try:
                    profile = TechnicianProfile.objects.get(user_id=user_id)
                    serializer = TechnicianProfileSerializer(profile)
                    return Response(serializer.data)
                except TechnicianProfile.DoesNotExist:
                    return Response({"error": "Technician profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            profile = TechnicianProfile.objects.get(user=request.user)
            serializer = TechnicianProfileSerializer(profile)
            return Response(serializer.data)
        except TechnicianProfile.DoesNotExist:
            return Response({"error": "Technician profile not found for this user"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        """Update technician profile"""
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
        user = request.user
        # Get the image from the request (key should be 'profile_image')
        if 'profile_image' not in request.data:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.profile_image = request.data['profile_image']
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
    http_method_names = ['get', 'put', 'patch']

    # FIX 2: Only return the profile of the logged-in user.
    def get_queryset(self):
        return EmployeeProfile.objects.filter(user=self.request.user)


class TechnicianProfileViewSet(viewsets.ModelViewSet):
    """
    Technician can view and update their OWN profile.
    """
    serializer_class = TechnicianProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser,  JSONParser]
    
    # Only allow viewing and updating
    http_method_names = ['get', 'put', 'patch']

    def get_queryset(self):
        return TechnicianProfile.objects.filter(user=self.request.user)