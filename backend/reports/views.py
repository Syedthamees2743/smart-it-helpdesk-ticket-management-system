import datetime
from collections import defaultdict

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from django.utils import timezone
from django.db.models import Count, Avg, Q

from tickets.models import Ticket, IssueCategory
from assets.models import Asset, AssetAssignment, AssetCategory
from feedback.models import Feedback
from departments.models import Department
from accounts.permissions import IsAdmin
from .utils import generate_pdf_report


def _parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _get_filters(request):
    p = request.query_params
    return {
        "start_date": p.get("start_date") or "",
        "end_date": p.get("end_date") or "",
        "status": p.get("status") or "",
        "priority": p.get("priority") or "",
        "department": p.get("department") or "",
        "category": p.get("category") or "",
        "technician": p.get("technician") or "",
    }


def _apply_ticket_filters(qs, f):
    start = _parse_date(f["start_date"])
    end = _parse_date(f["end_date"])
    if start:
        qs = qs.filter(created_at__date__gte=start)
    if end:
        qs = qs.filter(created_at__date__lte=end)
    if f["status"]:
        qs = qs.filter(status=f["status"])
    if f["priority"]:
        qs = qs.filter(priority=f["priority"])
    if f["department"]:
        qs = qs.filter(department_id=f["department"])
    if f["category"]:
        qs = qs.filter(category_id=f["category"])
    if f["technician"]:
        qs = qs.filter(assigned_technician_id=f["technician"])
    return qs


def _apply_asset_filters(qs, f):
    start = _parse_date(f["start_date"])
    end = _parse_date(f["end_date"])
    if f["status"]:
        qs = qs.filter(status=f["status"])
    if f["category"]:
        qs = qs.filter(category_id=f["category"])
    if start:
        qs = qs.filter(purchase_date__gte=start)
    if end:
        qs = qs.filter(purchase_date__lte=end)
    return qs


def _build_subtitle(filters):
    parts = []
    if filters["start_date"] and filters["end_date"]:
        parts.append(f"Date Range: {filters['start_date']} to {filters['end_date']}")
    elif filters["start_date"]:
        parts.append(f"From: {filters['start_date']}")
    elif filters["end_date"]:
        parts.append(f"Until: {filters['end_date']}")
    if filters["status"]:
        parts.append(f"Status: {filters['status'].replace('_', ' ').title()}")
    if filters["priority"]:
        parts.append(f"Priority: {filters['priority'].title()}")
    if filters["department"]:
        dept = Department.objects.filter(id=filters["department"]).first()
        if dept:
            parts.append(f"Department: {dept.name}")
    if filters["category"]:
        cat = IssueCategory.objects.filter(id=filters["category"]).first()
        if not cat:
            cat = AssetCategory.objects.filter(id=filters["category"]).first()
        if cat:
            parts.append(f"Category: {cat.name}")
    if filters["technician"]:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        tech = User.objects.filter(id=filters["technician"]).first()
        if tech:
            parts.append(f"Technician: {tech.get_full_name()}")
    return " | ".join(parts) if parts else ""


def _format_duration(td):
    if not td:
        return "N/A"
    total_sec = int(td.total_seconds())
    if total_sec < 0:
        return "N/A"
    d, rem = divmod(total_sec, 86400)
    h, rem = divmod(rem, 3600)
    m = rem // 60
    parts = []
    if d:
        parts.append(f"{d}d")
    if h:
        parts.append(f"{h}h")
    if m or not parts:
        parts.append(f"{m}m")
    return " ".join(parts)


def _sla_status(ticket, now=None):
    if now is None:
        now = timezone.now()
    if not ticket.sla_deadline:
        return "Pending"
    if ticket.status in ("resolved", "closed") and ticket.resolved_at:
        return "Met" if ticket.resolved_at <= ticket.sla_deadline else "Breached"
    if now > ticket.sla_deadline:
        return "Breached"
    return "Pending"


def _resolution_time(ticket):
    if ticket.resolved_at and ticket.created_at:
        return _format_duration(ticket.resolved_at - ticket.created_at)
    return "N/A"


def _get_employee_label(user):
    """Return 'Name (EMP-001)' or just 'Name'."""
    profile = getattr(user, 'employee_profile', None)
    if profile and profile.employee_id:
        return f"{user.get_full_name()} ({profile.employee_id})"
    return user.get_full_name()


def _get_technician_label(user):
    """Return 'Name (TECH-004)' or just 'Name' or 'Unassigned'."""
    if not user:
        return "Unassigned"
    profile = getattr(user, 'technician_profile', None)
    if profile and profile.technician_id:
        return f"{user.get_full_name()} ({profile.technician_id})"
    return user.get_full_name()


def _get_dept_name(ticket):
    if ticket.department:
        return ticket.department.name
    profile = getattr(ticket.employee, 'employee_profile', None)
    if profile and profile.department:
        return profile.department.name
    return "N/A"


def _safe_pdf(view_fn):
    def wrapper(self, request, *args, **kwargs):
        try:
            return view_fn(self, request, *args, **kwargs)
        except Exception:
            return Response(
                {"error": "Unable to generate report. Please try again."},
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    return wrapper


# ════════════════════════════════════════════════════════════════
# 1. COMPLETE TICKET REPORT
# ════════════════════════════════════════════════════════════════


class AllTicketsPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        qs = _apply_ticket_filters(
            Ticket.objects.select_related(
                "employee", "assigned_technician", "department", "category",
                "employee__employee_profile", "assigned_technician__technician_profile",
            ),
            filters,
        ).order_by("-created_at")

        now = timezone.now()
        headers = [
            "Ticket #",
            "Employee",
            "Employee ID",
            "Department",
            "Category",
            "Priority",
            "Status",
            "Technician",
            "Technician ID",
            "Created",
            "Updated",
            "SLA Status",
            "Resolution Time",
        ]
        data = []
        for t in qs:
            emp_profile = getattr(t.employee, 'employee_profile', None)
            tech_profile = getattr(t.assigned_technician, 'technician_profile', None) if t.assigned_technician else None
            data.append([
                t.ticket_number,
                t.employee.get_full_name(),
                emp_profile.employee_id if emp_profile else "N/A",
                _get_dept_name(t),
                t.category.name if t.category else "N/A",
                t.priority.upper(),
                t.status.replace("_", " ").title(),
                _get_technician_label(t.assigned_technician),
                tech_profile.technician_id if tech_profile else "N/A",
                t.created_at.strftime("%Y-%m-%d %H:%M"),
                t.updated_at.strftime("%Y-%m-%d %H:%M"),
                _sla_status(t, now),
                _resolution_time(t),
            ])

        return generate_pdf_report(
            title="IT Service Desk \u2014 Complete Ticket Report",
            headers=headers,
            data=data,
            filename="all_tickets_report.pdf",
            landscape=True,
            subtitle=_build_subtitle(filters),
        )


# ════════════════════════════════════════════════════════════════
# 2. TECHNICIAN PERFORMANCE REPORT
# ════════════════════════════════════════════════════════════════


class TechnicianPerformancePDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        tickets = _apply_ticket_filters(
            Ticket.objects.filter(assigned_technician__isnull=False).select_related(
                "assigned_technician", "assigned_technician__technician_profile"
            ).prefetch_related("feedbacks"),
            filters,
        )

        now = timezone.now()
        bucket = defaultdict(
            lambda: {
                "name": "",
                "tech_id": "",
                "department": "",
                "total": 0,
                "resolved": 0,
                "open": 0,
                "in_progress": 0,
                "res_times": [],
                "sla_met": 0,
                "sla_breached": 0,
                "ratings": [],
            }
        )

        for t in tickets:
            tech = t.assigned_technician
            tech_profile = getattr(tech, 'technician_profile', None)
            b = bucket[tech.id]
            b["name"] = tech.get_full_name()
            b["tech_id"] = tech_profile.technician_id if tech_profile else "N/A"
            b["department"] = tech_profile.department.name if tech_profile and tech_profile.department else "N/A"
            b["total"] += 1

            if t.status in ("resolved", "closed"):
                b["resolved"] += 1
            elif t.status in ("open", "reopened"):
                b["open"] += 1
            elif t.status in ("assigned", "in_progress"):
                b["in_progress"] += 1

            if t.resolved_at and t.created_at:
                b["res_times"].append(t.resolved_at - t.created_at)

            if t.sla_deadline:
                if t.status in ("resolved", "closed") and t.resolved_at:
                    if t.resolved_at <= t.sla_deadline:
                        b["sla_met"] += 1
                    else:
                        b["sla_breached"] += 1
                elif now > t.sla_deadline:
                    b["sla_breached"] += 1

            for fb in t.feedbacks.all():
                b["ratings"].append(fb.rating)

        headers = [
            "Technician",
            "Technician ID",
            "Department",
            "Assigned",
            "Resolved",
            "Open",
            "In Progress",
            "Avg Res. Time",
            "SLA Met",
            "SLA Breached",
            "Avg Rating",
            "Performance %",
        ]
        data = []
        for b in sorted(bucket.values(), key=lambda x: x["total"], reverse=True):
            avg_rt = (
                _format_duration(
                    sum(b["res_times"], datetime.timedelta()) / len(b["res_times"])
                )
                if b["res_times"]
                else "N/A"
            )
            avg_rating = (
                f"{sum(b['ratings']) / len(b['ratings']):.1f}"
                if b["ratings"]
                else "N/A"
            )
            perf = (
                f"{(b['resolved'] / b['total']) * 100:.1f}%"
                if b["total"]
                else "0.0%"
            )
            data.append(
                [
                    b["name"],
                    b["tech_id"],
                    b["department"],
                    str(b["total"]),
                    str(b["resolved"]),
                    str(b["open"]),
                    str(b["in_progress"]),
                    avg_rt,
                    str(b["sla_met"]),
                    str(b["sla_breached"]),
                    avg_rating,
                    perf,
                ]
            )

        return generate_pdf_report(
            title="IT Service Desk \u2014 Technician Performance Report",
            headers=headers,
            data=data,
            filename="technician_performance_report.pdf",
            landscape=True,
            subtitle=_build_subtitle(filters),
        )


# ════════════════════════════════════════════════════════════════
# 3. ASSET REPORT
# ════════════════════════════════════════════════════════════════


class AssetPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        assets = _apply_asset_filters(
            Asset.objects.select_related("category").prefetch_related(
                "assignments__employee", "assignments__employee__employee_profile"
            ),
            filters,
        ).order_by("asset_code")

        headers = [
            "Asset Code",
            "Asset Name",
            "Category",
            "Brand",
            "Model",
            "Assigned To",
            "Employee ID",
            "Department",
            "Status",
            "Purchase Date",
            "Warranty Expiry",
        ]
        data = []
        for a in assets:
            active = None
            for asn in a.assignments.all():
                if asn.status == "active":
                    active = asn
                    break
            emp_name = (
                active.employee.get_full_name()
                if active and active.employee
                else "Unassigned"
            )
            emp_profile = getattr(active.employee, 'employee_profile', None) if active and active.employee else None
            emp_id = emp_profile.employee_id if emp_profile else "N/A"
            emp_dept = ""
            if emp_profile and emp_profile.department:
                emp_dept = emp_profile.department.name
            data.append(
                [
                    a.asset_code,
                    a.asset_name,
                    a.category.name if a.category else "N/A",
                    a.brand or "N/A",
                    a.model or "N/A",
                    emp_name,
                    emp_id,
                    emp_dept or "N/A",
                    a.status.replace("_", " ").title(),
                    a.purchase_date.strftime("%Y-%m-%d") if a.purchase_date else "N/A",
                    a.warranty_expiry.strftime("%Y-%m-%d") if a.warranty_expiry else "N/A",
                ]
            )

        return generate_pdf_report(
            title="IT Service Desk \u2014 Asset Report",
            headers=headers,
            data=data,
            filename="asset_report.pdf",
            landscape=True,
            subtitle=_build_subtitle(filters),
        )


# ════════════════════════════════════════════════════════════════
# 4. FEEDBACK & RATING REPORT
# ════════════════════════════════════════════════════════════════


class FeedbackPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        qs = Feedback.objects.select_related(
            "ticket", "employee", "ticket__assigned_technician",
            "employee__employee_profile",
            "ticket__assigned_technician__technician_profile",
        ).order_by("-created_at")

        start = _parse_date(filters["start_date"])
        end = _parse_date(filters["end_date"])
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)
        if filters["technician"]:
            qs = qs.filter(ticket__assigned_technician_id=filters["technician"])
        if filters["status"]:
            qs = qs.filter(ticket__status=filters["status"])
        if filters["priority"]:
            qs = qs.filter(ticket__priority=filters["priority"])
        if filters["department"]:
            qs = qs.filter(ticket__department_id=filters["department"])

        feedbacks = list(qs)

        avg_rating = None
        if feedbacks:
            avg_rating = sum(fb.rating for fb in feedbacks) / len(feedbacks)

        headers = [
            "Ticket #",
            "Employee",
            "Employee ID",
            "Department",
            "Technician",
            "Rating",
            "Review",
            "Date",
        ]
        data = []
        for fb in feedbacks:
            emp_profile = getattr(fb.employee, 'employee_profile', None)
            tech = fb.ticket.assigned_technician
            tech_profile = getattr(tech, 'technician_profile', None) if tech else None
            review = fb.review or "No review"
            if len(review) > 80:
                review = review[:77] + "..."
            data.append(
                [
                    fb.ticket.ticket_number,
                    fb.employee.get_full_name(),
                    emp_profile.employee_id if emp_profile else "N/A",
                    emp_profile.department.name if emp_profile and emp_profile.department else "N/A",
                    _get_technician_label(tech),
                    f"{fb.rating}/5",
                    review,
                    fb.created_at.strftime("%Y-%m-%d"),
                ]
            )

        summary = []
        if avg_rating is not None:
            summary.append(
                f"Total Feedbacks: {len(feedbacks)}    |    "
                f"Average Rating: {avg_rating:.1f} / 5"
            )

        return generate_pdf_report(
            title="IT Service Desk \u2014 Feedback & Rating Report",
            headers=headers,
            data=data,
            filename="feedback_report.pdf",
            subtitle=_build_subtitle(filters),
            summary=summary,
        )


# ════════════════════════════════════════════════════════════════
# 5. SLA REPORT
# ════════════════════════════════════════════════════════════════


class SLAPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        qs = _apply_ticket_filters(
            Ticket.objects.select_related(
                "employee", "assigned_technician",
                "employee__employee_profile",
            ),
            filters,
        ).order_by("-created_at")

        now = timezone.now()
        met_count = 0
        breached_count = 0
        pending_count = 0

        headers = [
            "Ticket #",
            "Employee",
            "Employee ID",
            "Department",
            "Priority",
            "Created",
            "SLA Deadline",
            "Resolved At",
            "Resolution Time",
            "SLA Status",
        ]
        data = []
        for t in qs:
            ss = _sla_status(t, now)
            if ss == "Met":
                met_count += 1
            elif ss == "Breached":
                breached_count += 1
            else:
                pending_count += 1

            emp_profile = getattr(t.employee, 'employee_profile', None)
            data.append(
                [
                    t.ticket_number,
                    t.employee.get_full_name(),
                    emp_profile.employee_id if emp_profile else "N/A",
                    _get_dept_name(t),
                    t.priority.upper(),
                    t.created_at.strftime("%Y-%m-%d %H:%M"),
                    t.sla_deadline.strftime("%Y-%m-%d %H:%M") if t.sla_deadline else "N/A",
                    t.resolved_at.strftime("%Y-%m-%d %H:%M") if t.resolved_at else "N/A",
                    _resolution_time(t),
                    ss,
                ]
            )

        total = met_count + breached_count + pending_count
        summary = [
            f"Total: {total}    |    Met: {met_count}    |    "
            f"Breached: {breached_count}    |    Pending: {pending_count}",
        ]
        if total > 0:
            summary.append(
                f"SLA Compliance Rate: {(met_count / total) * 100:.1f}%"
            )

        return generate_pdf_report(
            title="IT Service Desk \u2014 SLA Report",
            headers=headers,
            data=data,
            filename="sla_report.pdf",
            landscape=True,
            subtitle=_build_subtitle(filters),
            summary=summary,
        )


# ════════════════════════════════════════════════════════════════
# 6. EMPLOYEE / TICKET SUMMARY REPORT
# ════════════════════════════════════════════════════════════════


class EmployeeSummaryPDFView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @_safe_pdf
    def get(self, request):
        filters = _get_filters(request)
        qs = _apply_ticket_filters(
            Ticket.objects.select_related(
                "employee", "department",
                "employee__employee_profile",
            ).prefetch_related("feedbacks"),
            filters,
        )

        bucket = defaultdict(
            lambda: {
                "name": "",
                "emp_id": "",
                "department": "",
                "total": 0,
                "open": 0,
                "in_progress": 0,
                "resolved": 0,
                "closed": 0,
                "res_times": [],
                "sla_met": 0,
                "sla_total": 0,
                "ratings": [],
            }
        )

        for t in qs:
            emp = t.employee
            b = bucket[emp.id]
            b["name"] = emp.get_full_name()
            profile = getattr(emp, 'employee_profile', None)
            if profile:
                b["emp_id"] = profile.employee_id
                if not b["department"]:
                    b["department"] = profile.department.name if profile.department else "N/A"
            b["total"] += 1

            if t.status in ("open", "reopened"):
                b["open"] += 1
            elif t.status in ("assigned", "in_progress"):
                b["in_progress"] += 1
            elif t.status == "resolved":
                b["resolved"] += 1
            elif t.status == "closed":
                b["closed"] += 1

            if t.resolved_at and t.created_at:
                b["res_times"].append(t.resolved_at - t.created_at)

            if t.sla_deadline:
                b["sla_total"] += 1
                if t.status in ("resolved", "closed") and t.resolved_at:
                    if t.resolved_at <= t.sla_deadline:
                        b["sla_met"] += 1

            for fb in t.feedbacks.all():
                b["ratings"].append(fb.rating)

        headers = [
            "Employee",
            "Employee ID",
            "Department",
            "Total",
            "Open",
            "In Progress",
            "Resolved",
            "Closed",
            "Avg Res. Time",
            "SLA Met %",
            "Avg Rating",
        ]
        data = []
        for b in sorted(bucket.values(), key=lambda x: x["total"], reverse=True):
            avg_rt = (
                _format_duration(
                    sum(b["res_times"], datetime.timedelta()) / len(b["res_times"])
                )
                if b["res_times"]
                else "N/A"
            )
            sla_pct = (
                f"{(b['sla_met'] / b['sla_total']) * 100:.1f}%"
                if b["sla_total"]
                else "N/A"
            )
            avg_rating = (
                f"{sum(b['ratings']) / len(b['ratings']):.1f}"
                if b["ratings"]
                else "N/A"
            )
            data.append(
                [
                    b["name"],
                    b["emp_id"] or "N/A",
                    b["department"] or "N/A",
                    str(b["total"]),
                    str(b["open"]),
                    str(b["in_progress"]),
                    str(b["resolved"]),
                    str(b["closed"]),
                    avg_rt,
                    sla_pct,
                    avg_rating,
                ]
            )

        return generate_pdf_report(
            title="IT Service Desk \u2014 Employee / Ticket Summary Report",
            headers=headers,
            data=data,
            filename="employee_ticket_summary_report.pdf",
            landscape=True,
            subtitle=_build_subtitle(filters),
        )