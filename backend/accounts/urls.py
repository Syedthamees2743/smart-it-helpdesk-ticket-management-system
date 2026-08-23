"""
URL patterns for Authentication and User Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Create a router for the Profile ViewSets
profile_router = DefaultRouter()
profile_router.register(r'employee', views.EmployeeProfileViewSet, basename='employee-profile')
profile_router.register(r'technician', views.TechnicianProfileViewSet, basename='technician-profile')

urlpatterns = [
    # --- Public Auth URLs ---
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- Protected Auth URLs ---
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),

    # --- Admin User Management URLs ---
    path('users/', views.UserManagementView.as_view(), name='user-management'),
    path('users/pending/', views.PendingUsersView.as_view(), name='pending-users'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/toggle-status/', views.ToggleUserStatusView.as_view(), name='toggle-user-status'),
    path('users/<int:pk>/role-profile/', views.UserRoleProfileView.as_view(), name='user-role-profile'),
    path('users/<int:pk>/approve/', views.ApproveUserView.as_view(), name='approve-user'),
    path('users/<int:pk>/reject/', views.RejectUserView.as_view(), name='reject-user'),

    # --- Signup URLs (public, no auth required) ---
    path('signup/employee/', views.EmployeeSignupView.as_view(), name='employee-signup'),
    path('signup/technician/', views.TechnicianSignupView.as_view(), name='technician-signup'),

    # --- Activation URLs (public, no auth required) ---
    path('activate/<str:token>/', views.ActivateAccountView.as_view(), name='activate-account'),
    path('activate/resend/', views.ResendActivationView.as_view(), name='resend-activation'),

    # --- Profile URLs (Using Router) ---
    path('profiles/', include(profile_router.urls)),

    # --- Profile Image Upload ---
    path('update-profile-image/', views.UpdateProfileImageView.as_view(), name='update-profile-image'),

    # --- Own Profile Update & Change Password ---
    path('update-own-profile/', views.UpdateOwnProfileView.as_view(), name='update-own-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
]