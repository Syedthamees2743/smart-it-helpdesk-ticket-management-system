from django.urls import path
from . import views

urlpatterns = [
    path('tickets-pdf/', views.AllTicketsPDFView.as_view(), name='tickets-pdf'),
    path('technician-performance-pdf/', views.TechnicianPerformancePDFView.as_view(), name='technician-performance-pdf'),
    path('asset-pdf/', views.AssetPDFView.as_view(), name='asset-pdf'),
    path('feedback-pdf/', views.FeedbackPDFView.as_view(), name='feedback-pdf'),
    path('sla-pdf/', views.SLAPDFView.as_view(), name='sla-pdf'),
    path('employee-summary-pdf/', views.EmployeeSummaryPDFView.as_view(), name='employee-summary-pdf'),
]