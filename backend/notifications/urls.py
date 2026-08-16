"""
URL patterns for Notification Module
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('settings/', views.SettingsView.as_view(), name='notification-settings'),
    path('admin/preferences/<int:user_id>/', views.AdminUserPreferencesView.as_view(), name='admin-user-preferences'),
    path('', include(router.urls)),
]