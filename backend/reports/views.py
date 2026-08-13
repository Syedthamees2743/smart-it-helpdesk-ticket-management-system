"""
Views for generating and downloading PDF Reports
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Avg, Q

from tickets.models import Ticket
from assets.models import Asset, AssetAssignment
from feedback.models import Feedback
from accounts.permissions import IsAdmin
from .utils import generate_pdf_report


class AllTicketsPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        tickets = Ticket.objects.all().order_by("-created_at")

        headers = [
            "Ticket #",
            "Employee",
            "Technician",
            "Priority",
            "Status",
            "Created At",
        ]
        data = [
            [
                t.ticket_number,
                t.employee.get_full_name(),
                t.assigned_technician.get_full_name()
                if t.assigned_technician
                else "Unassigned",
                t.priority.upper(),
                t.status.upper(),
                t.created_at.strftime("%Y-%m-%d"),
            ]
            for t in tickets
        ]

        return generate_pdf_report(
            title="IT Service Desk - All Tickets Report",
            headers=headers,
            data=data,
            filename="all_tickets_report.pdf",
        )


class TechnicianPerformancePDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        technicians = (
            Ticket.objects.filter(assigned_technician__isnull=False)
            .values(
                "assigned_technician__id",
                "assigned_technician__first_name",
                "assigned_technician__last_name",
            )
            .annotate(
                total_assigned=Count("id"),
                resolved_count=Count("id", filter=Q(status="closed")),
                avg_rating=Avg("feedbacks__rating"),
            )
            .order_by("-resolved_count")
        )

        headers = ["Technician Name", "Total Assigned", "Resolved/Closed", "Avg Rating"]
        data = [
            [
                f"{t['assigned_technician__first_name']} {t['assigned_technician__last_name']}",
                str(t["total_assigned"]),
                str(t["resolved_count"]),
                f"{t['avg_rating']:.1f}" if t["avg_rating"] else "N/A",
            ]
            for t in technicians
        ]

        return generate_pdf_report(
            title="IT Service Desk - Technician Performance Report",
            headers=headers,
            data=data,
            filename="technician_performance_report.pdf",
        )


# ============================================================
# DAY 10: NEW REPORTS
# ============================================================


class AssetPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        assets = Asset.objects.all().order_by("-created_at")

        headers = ["Asset Name", "Serial Number", "Category", "Status", "Assigned To"]
        data = []
        for a in assets:
            # Find active assignment if any
            active_assignment = AssetAssignment.objects.filter(
                asset=a, status="active"
            ).first()
            assigned_to = (
                active_assignment.employee.get_full_name()
                if active_assignment and active_assignment.employee
                else "Unassigned"
            )

            data.append(
                [
                    a.asset_name,
                    a.serial_number or "N/A",
                    a.category.name if a.category else "N/A",
                    a.status.upper(),
                    assigned_to,
                ]
            )

        return generate_pdf_report(
            title="IT Service Desk - Asset Report",
            headers=headers,
            data=data,
            filename="asset_report.pdf",
        )


class FeedbackPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        feedbacks = Feedback.objects.select_related(
            "ticket", "employee", "ticket__assigned_technician"
        ).order_by("-created_at")

        headers = ["Ticket", "Employee", "Technician", "Rating", "Review", "Date"]
        data = [
            [
                f.ticket.ticket_number,
                f.employee.get_full_name(),
                f.ticket.assigned_technician.get_full_name()
                if f.ticket.assigned_technician
                else "Unassigned",
                f"{f.rating}/5",
                (f.review[:80] + "...")
                if f.review and len(f.review) > 80
                else (f.review or "No review"),
                f.created_at.strftime("%Y-%m-%d"),
            ]
            for f in feedbacks
        ]

        return generate_pdf_report(
            title="IT Service Desk - Feedback Report",
            headers=headers,
            data=data,
            filename="feedback_report.pdf",
        )


class SLAPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        tickets = Ticket.objects.all().order_by("-created_at")
        now = timezone.now()

        headers = [
            "Ticket #",
            "Employee",
            "Priority",
            "SLA Deadline",
            "Status",
            "SLA Status",
        ]
        data = []
        for t in tickets:
            # Calculate SLA status (same logic as serializer)
            if not t.sla_deadline:
                sla_status = "Pending"
            elif t.status in ["resolved", "closed"] and t.resolved_at:
                sla_status = "Met" if t.resolved_at <= t.sla_deadline else "Breached"
            elif now > t.sla_deadline:
                sla_status = "Breached"
            else:
                sla_status = "Pending"

            data.append(
                [
                    t.ticket_number,
                    t.employee.get_full_name(),
                    t.priority.upper(),
                    t.sla_deadline.strftime("%Y-%m-%d %H:%M")
                    if t.sla_deadline
                    else "N/A",
                    t.status.upper(),
                    sla_status,
                ]
            )

        return generate_pdf_report(
            title="IT Service Desk - SLA Report",
            headers=headers,
            data=data,
            filename="sla_report.pdf",
        )
