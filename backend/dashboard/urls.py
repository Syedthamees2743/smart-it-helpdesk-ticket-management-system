from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('employee/', views.EmployeeDashboardAPIView.as_view(), name='employee-dashboard'),
    path('technician/', views.TechnicianDashboardAPIView.as_view(), name='technician-dashboard'),
]