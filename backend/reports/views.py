"""
Views for generating and downloading PDF Reports
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Avg

from tickets.models import Ticket
from assets.models import Asset
from feedback.models import Feedback
from accounts.permissions import IsAdmin
from .utils import generate_pdf_report


class AllTicketsPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        tickets = Ticket.objects.all().order_by('-created_at')
        
        headers = ['Ticket #', 'Employee', 'Technician', 'Priority', 'Status', 'Created At']
        data = [
            [
                t.ticket_number,
                t.employee.get_full_name(),
                t.assigned_technician.get_full_name() if t.assigned_technician else "Unassigned",
                t.priority.upper(),
                t.status.upper(),
                t.created_at.strftime("%Y-%m-%d")
            ] for t in tickets
        ]
        
        return generate_pdf_report(
            title="IT Service Desk - All Tickets Report",
            headers=headers,
            data=data,
            filename="all_tickets_report.pdf"
        )


class TechnicianPerformancePDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Complex query: Group by technician, count tickets, calculate avg rating
        technicians = Ticket.objects.filter(assigned_technician__isnull=False).values(
            'assigned_technician__id',
            'assigned_technician__first_name',
            'assigned_technician__last_name'
        ).annotate(
            total_assigned=Count('id'),
            resolved_count=Count('id', filter=Q(status='closed')),
            avg_rating=Avg('feedbacks__rating') # Uses the reverse relation from Feedback model
        ).order_by('-resolved_count')

        headers = ['Technician Name', 'Total Assigned', 'Resolved/Closed', 'Avg Rating']
        data = [
            [
                f"{t['assigned_technician__first_name']} {t['assigned_technician__last_name']}",
                t['total_assigned'],
                t['resolved_count'],
                f"{t['avg_rating']:.1f}" if t['avg_rating'] else "N/A"
            ] for t in technicians
        ]
        
        return generate_pdf_report(
            title="IT Service Desk - Technician Performance Report",
            headers=headers,
            data=data,
            filename="technician_performance_report.pdf"
        )

# Need to add this import at the top of the file
from django.db.models import Q