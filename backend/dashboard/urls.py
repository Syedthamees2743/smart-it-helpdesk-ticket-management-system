from django.urls import path

from dashboard import admin_analytics_views
from . import views

urlpatterns = [
    path('admin/', views.AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('employee/', views.EmployeeDashboardAPIView.as_view(), name='employee-dashboard'),
    path('technician/', views.TechnicianDashboardAPIView.as_view(), name='technician-dashboard'),
    path('technician-performance/', views.TechnicianPerformanceAPIView.as_view(), name='technician-performance'),
    path('my-performance/', views.MyPerformanceAPIView.as_view(), name='my-performance'),
    # DAY 14: Analytics endpoint
    path('admin-analytics/', admin_analytics_views.AdminAnalyticsAPIView.as_view(), name='admin-analytics'),
    path('ai/support-insights/', views.AISupportInsightsView.as_view(), name='ai-support-insights'),
]