import secrets
from rest_framework import generics, status, permissions, viewsets, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from tickets.models import Ticket

from .serializers import (
    AdminCreateUserSerializer,
    RegisterSerializer,
    UserSerializer,
    EmployeeProfileSerializer,
    TechnicianProfileSerializer,
    EmployeeSignupSerializer,
    TechnicianSignupSerializer,
    ActivateAccountSerializer,
    PendingUserSerializer,
)
from .models import User, AccountActivation, EmployeeProfile, TechnicianProfile
from .permissions import IsAdmin, IsEmployee, IsTechnician


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================


class RegisterView(generics.CreateAPIView):
    """Public registration endpoint."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(APIView):
    """Get current user info."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """Logout and blacklist refresh token."""
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
# CUSTOM LOGIN WITH ACCOUNT STATUS CHECK
# ============================================================

class CustomTokenObtainPairView(APIView):
    """
    Replaces simplejwt TokenObtainPairView.
    Adds account_status checks before issuing JWT tokens.
    """
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check account status
        if user.account_status == 'pending':
            return Response(
                {"detail": "Your account is awaiting administrator approval."},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.account_status == 'rejected':
            detail = "Your account registration was rejected."
            if user.rejection_reason:
                detail += f" Reason: {user.rejection_reason}"
            detail += " Please contact the administrator."
            return Response(
                {"detail": detail},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.account_status == 'approved' and not user.is_active:
            return Response(
                {"detail": "Please activate your account using the link sent to your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {"detail": "Your account has been deactivated. Contact the administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


# ============================================================
# USER MANAGEMENT (ADMIN)
# ============================================================

class UserManagementView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/ — List all users (admin only)
    POST /api/auth/users/ — Create a new user (admin only)
    """
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return AdminCreateUserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')
        role = self.request.query_params.get('role', '')
        is_active = self.request.query_params.get('is_active', '')
        account_status = self.request.query_params.get('account_status', '')

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

        if account_status:
            qs = qs.filter(account_status=account_status)

        return qs

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
                        {'success': False, 'error': 'A record with these details already exists.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            return Response(
                {'success': False, 'error': 'Failed to create user. Please check all fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send activation email for Employee and Technician
        role = getattr(serializer, 'created_user_role', None)
        email_sent = True
        email_warning = None

        if role and role.lower() in ['employee', 'technician']:
            from notifications.account_emails import send_approval_email

            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timezone.timedelta(
                hours=getattr(settings, 'ACTIVATION_TOKEN_EXPIRE_HOURS', 24)
            )

            AccountActivation.objects.create(
                user=user,
                token=token,
                expires_at=expires_at,
            )

            email_sent = send_approval_email(user, token)

            if not email_sent:
                email_warning = "User created but failed to send activation email. Please share the activation link manually."

        output_serializer = UserSerializer(user, context={'request': request})

        if email_sent:
            message = "User created successfully. Activation link has been sent to the user's email."
        else:
            message = email_warning

        return Response(
            {'success': True, 'message': message, 'data': output_serializer.data},
            status=status.HTTP_201_CREATED
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a user (admin only)."""
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
    """Toggle user active status (admin only)."""
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
# EMPLOYEE SIGNUP VIEW
# ==========================================

class EmployeeSignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = EmployeeSignupSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = serializer.save()
            
            # Get the auto-assigned employee_id from the created profile
            try:
                employee_id = user.employee_profile.employee_id
            except:
                employee_id = 'N/A'
            
            # Safely try to send email
            try:
                from notifications.account_emails import send_registration_received_email
                send_registration_received_email(user)
            except Exception as e:
                print(f"[Employee Signup] Email error (ignored): {e}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Registration submitted successfully. Your account is pending administrator approval.',
                    'data': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role,
                        'account_status': user.account_status,
                        'employee_id': employee_id,  # ADD THIS
                    }
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"[Employee Signup] ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================
# TECHNICIAN SIGNUP VIEW
# ==========================================

class TechnicianSignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            serializer = TechnicianSignupSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user = serializer.save()
            
            # Get the auto-assigned technician_id from the created profile
            try:
                technician_id = user.technician_profile.technician_id
            except:
                technician_id = 'N/A'
            
            # Safely try to send email
            try:
                from notifications.account_emails import send_registration_received_email
                send_registration_received_email(user)
            except Exception as e:
                print(f"[Technician Email] Email error (ignored): {e}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Registration submitted successfully. Your account is pending administrator approval.',
                    'data': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role,
                        'account_status': user.account_status,
                        'technician_id': technician_id,  # ADD THIS
                    }
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"[Technician Signup] ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    'success': False,
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ==========================================
# ACTIVATE ACCOUNT VIEW
# ==========================================

class ActivateAccountView(APIView):
    """
    GET  /api/auth/activate/<token>/  — Validate token, return user info.
    POST /api/auth/activate/<token>/  — Validate token, set password, activate account.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            activation = AccountActivation.objects.select_related('user').get(token=token)
        except AccountActivation.DoesNotExist:
            return Response(
                {'detail': 'Invalid activation link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, error = activation.is_valid()
        if not is_valid:
            return Response(
                {'detail': error},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'success': True,
            'data': {
                'user_id': activation.user.id,
                'full_name': activation.user.get_full_name() or activation.user.username,
                'username': activation.user.username,
                'role': activation.user.get_role_display(),
            }
        })

    def post(self, request, token):
        try:
            activation = AccountActivation.objects.select_related('user').get(token=token)
        except AccountActivation.DoesNotExist:
            return Response(
                {'detail': 'Invalid activation link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, error = activation.is_valid()
        if not is_valid:
            return Response(
                {'detail': error},
                status=status.HTTP_400_BAD_REQUEST
            )

        if activation.used:
            return Response(
                {'detail': 'This activation link has already been used.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = activation.user
            user.set_password(serializer.validated_data['password'])
            user.account_status = 'active'
            user.is_active = True
            user.save()

            activation.used = True
            activation.save()

            # Send activation success email
            try:
                from notifications.account_emails import send_activation_success_email
                send_activation_success_email(user)
            except Exception as e:
                print(f"Failed to send activation success email: {e}")

        return Response(
            {
                'success': True,
                'message': 'Account activated successfully. You can now login.',
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# RESEND ACTIVATION LINK VIEW
# ==========================================

class ResendActivationView(APIView):
    """
    POST /api/auth/activate/resend/
    Public endpoint — allows user to request a new activation link.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"error": "No account found with this email address."},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.account_status != 'approved':
            return Response(
                {"error": f"This account is not eligible for activation. Current status: {user.get_account_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_active:
            return Response(
                {"error": "This account is already active. Please login."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete existing token and create new one
        AccountActivation.objects.filter(user=user).delete()

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(
            hours=getattr(settings, 'ACTIVATION_TOKEN_EXPIRE_HOURS', 24)
        )

        AccountActivation.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

        # Send new activation email
        from notifications.account_emails import send_approval_email
        email_sent = send_approval_email(user, token)

        if not email_sent:
            return Response(
                {"error": "Failed to send activation email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "success": True,
                "message": "A new activation link has been sent to your email.",
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# PENDING USERS VIEW (ADMIN)
# ==========================================

class PendingUsersView(APIView):
    """
    GET /api/auth/users/pending/ — List pending users (admin only).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        pending = User.objects.filter(account_status='pending').order_by('-date_joined')
        serializer = PendingUserSerializer(pending, many=True)
        return Response({
            'success': True,
            'count': pending.count(),
            'data': serializer.data,
        })


# ==========================================
# APPROVE USER VIEW (ADMIN)
# ==========================================

class ApproveUserView(APIView):
    """
    POST /api/auth/users/<pk>/approve/ — Approve a pending user (admin only).
    Generates activation token and sends approval email.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.account_status != 'pending':
            if user.account_status == 'active':
                return Response(
                    {"error": "This account is already active."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if user.account_status == 'rejected':
                return Response(
                    {"error": "This account was already rejected. Contact administrator."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"error": f"This account cannot be approved (status: {user.get_account_status_display()})"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from notifications.account_emails import send_approval_email

        # Generate secure token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(
            hours=getattr(settings, 'ACTIVATION_TOKEN_EXPIRE_HOURS', 24)
        )

        # Create activation record
        AccountActivation.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

        # Update user status
        user.account_status = 'approved'
        user.save()

        # Send approval email with activation link
        email_sent = send_approval_email(user, token)

        if not email_sent:
            return Response(
                {
                    'success': True,
                    'message': 'User approved, but failed to send activation email. Send the activation link manually.',
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                'success': True,
                'message': 'User approved. Activation email has been sent to the user.',
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# REJECT USER VIEW (ADMIN)
# ==========================================

class RejectUserView(APIView):
    """
    POST /api/auth/users/<pk>/reject/ — Reject a pending user (admin only).
    Optionally include a rejection reason.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.account_status != 'pending':
            return Response(
                {"error": f"Cannot reject a user with status: {user.get_account_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from notifications.account_emails import send_rejection_email

        reason = request.data.get('reason', '')

        # Update user status and save rejection reason
        user.account_status = 'rejected'
        user.rejection_reason = reason
        user.save()

        # Send rejection email
        email_sent = send_rejection_email(user, reason)

        message = 'User rejected. Rejection email sent successfully.' if email_sent else 'User rejected. Failed to send rejection email.'

        return Response(
            {
                'success': True,
                'message': message,
            },
            status=status.HTTP_200_OK
        )


# ==========================================
# PROFILE VIEWS
# ==========================================

class UpdateOwnProfileView(APIView):
    """Update own profile."""
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
    """Change own password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {"success": False, "error": {"detail": ["All three password fields are required."]}},
                status=status.HTTP_400_BAD_REQUEST,
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
                {
                    "success": False,
                    "error": {
                        "new_password": ["New password must be different from current password."]
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response({"success": True, "message": "Password changed successfully."})


class EmployeeProfileView(APIView):
    """Employee profile endpoints."""
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
            return Response(
                {"error": "Employee profile not found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

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
    """Technician profile endpoints."""
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
            return Response(
                {"error": "Technician profile not found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

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
    """Update profile image."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        if "profile_image" not in request.data:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)
        request.user.profile_image = request.data["profile_image"]
        request.user.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """Employee profile ViewSet."""
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "put", "patch"]

    def get_queryset(self):
        return EmployeeProfile.objects.filter(user=self.request.user)


class TechnicianProfileViewSet(viewsets.ModelViewSet):
    """Technician profile ViewSet."""
    serializer_class = TechnicianProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "put", "patch"]

    def get_queryset(self):
        return TechnicianProfile.objects.filter(user=self.request.user)


class UserRoleProfileView(APIView):
    """Admin: Get or update user's role-specific profile."""
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


# ==========================================
# SIGNAL: AUTO-CREATE PROFILE ON USER CREATION
# ==========================================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Only create empty profile if:
    1. User is newly created
    2. Profile doesn't already exist
    3. User is NOT from signup flow (signup creates profile with data)
    """
    if created:
        if instance.role == 'employee':
            EmployeeProfile.objects.get_or_create(
                user=instance,
                defaults={'employee_id': '', 'designation': ''}
            )
        elif instance.role == 'technician':
            TechnicianProfile.objects.get_or_create(
                user=instance,
                defaults={'technician_id': '', 'specialization': ''}
            )