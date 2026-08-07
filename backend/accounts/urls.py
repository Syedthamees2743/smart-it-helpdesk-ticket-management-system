"""
URL patterns for Authentication and User Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

# Create a router for the Profile ViewSets
profile_router = DefaultRouter()
profile_router.register(r'employee', views.EmployeeProfileViewSet, basename='employee-profile')
profile_router.register(r'technician', views.TechnicianProfileViewSet, basename='technician-profile')

urlpatterns = [
    # --- Public Auth URLs ---
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # --- Protected Auth URLs ---
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # --- Admin User Management URLs ---
    path('users/', views.UserManagementView.as_view(), name='user-management'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/toggle-status/', views.ToggleUserStatusView.as_view(), name='toggle-user-status'),
    
    # --- Upgraded Profile URLs (Using Router) ---
    path('profiles/', include(profile_router.urls)),
    
    # --- Profile Image Upload (Kept from yesterday) ---
    path('update-profile-image/', views.UpdateProfileImageView.as_view(), name='update-profile-image'),
]