from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('employee/', views.EmployeeDashboardAPIView.as_view(), name='employee-dashboard'),
    path('technician/', views.TechnicianDashboardAPIView.as_view(), name='technician-dashboard'),
    # DAY 13: Performance endpoints
    path('technician-performance/', views.TechnicianPerformanceAPIView.as_view(), name='technician-performance'),
    path('my-performance/', views.MyPerformanceAPIView.as_view(), name='my-performance'),
]