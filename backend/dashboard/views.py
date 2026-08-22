from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q, F, DurationField
from django.db.models.functions import TruncMonth
from django.db.models import ExpressionWrapper, FloatField

from departments.models import Department
from tickets.models import Ticket
from assets.models import Asset, AssetAssignment
from feedback.models import Feedback
from accounts.permissions import IsAdmin
from .services.ai_insights_service import generate_insights

User = get_user_model()


class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Access denied"}, status=403)

        now = timezone.now()
        tickets = Ticket.objects.select_related(
            "department", "assigned_technician", "employee"
        ).all()

        data = {
            "users": {
                "total_employees": User.objects.filter(
                    role="employee"
                ).count(),
                "total_technicians": User.objects.filter(
                    role="technician"
                ).count(),
                "total_departments": Department.objects.count(),
            },
            "tickets": {
                "total": tickets.count(),
                "open": tickets.filter(status="open").count(),
                "assigned": tickets.filter(status="assigned").count(),
                "in_progress": tickets.filter(status="in_progress").count(),
                "resolved": tickets.filter(status="resolved").count(),
                "closed": tickets.filter(status="closed").count(),
                "reopened": tickets.filter(status="reopened").count(),
                "sla_breached": tickets.filter(
                    status__in=["open", "assigned", "in_progress", "reopened"],
                    sla_deadline__lt=now,
                ).count(),
            },
            "assets": {
                "total": Asset.objects.count(),
                "available": Asset.objects.filter(status="available").count(),
                "assigned": Asset.objects.filter(status="assigned").count(),
                "maintenance": Asset.objects.filter(status="maintenance").count(),
            },
            "technician_ratings": list(
                User.objects.filter(role="technician")
                .annotate(avg_rating=Avg("assigned_tickets__feedbacks__rating"))
                .values("id", "first_name", "last_name", "avg_rating")
                .order_by("-avg_rating")[:5]
            ),
        }
        return Response(data)


class EmployeeDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "employee":
            return Response({"error": "Access denied"}, status=403)

        now = timezone.now()
        my_tickets = Ticket.objects.select_related(
            "assigned_technician", "category"
        ).filter(employee=request.user)

        my_total = my_tickets.count()
        my_open = my_tickets.filter(status="open").count()
        my_assigned = my_tickets.filter(status="assigned").count()
        my_in_progress = my_tickets.filter(status="in_progress").count()
        my_resolved = my_tickets.filter(status="resolved").count()
        my_closed = my_tickets.filter(status="closed").count()
        my_reopened = my_tickets.filter(status="reopened").count()

        STATUS_COLORS = {
            "open": "#3b82f6",
            "assigned": "#8b5cf6",
            "in_progress": "#f59e0b",
            "resolved": "#22c55e",
            "reopened": "#ef4444",
            "closed": "#64748b",
        }
        status_counts = my_tickets.values("status").annotate(count=Count("id"))
        status_distribution = [
            {
                "name": s["status"].replace("_", " ").title(),
                "value": s["count"],
                "fill": STATUS_COLORS.get(s["status"], "#64748b"),
            }
            for s in status_counts
        ]

        PRIORITY_COLORS = {
            "low": "#22c55e",
            "medium": "#3b82f6",
            "high": "#f59e0b",
            "critical": "#dc2626",
        }
        priority_counts = my_tickets.values("priority").annotate(count=Count("id"))
        priority_distribution = [
            {
                "name": p["priority"].capitalize(),
                "value": p["count"],
                "fill": PRIORITY_COLORS.get(p["priority"], "#64748b"),
            }
            for p in priority_counts
        ]

        # ── SLA Overview ──
        sla_resolved = my_tickets.filter(resolved_at__isnull=False)
        sla_total = sla_resolved.count()
        sla_met = sla_resolved.filter(resolved_at__lte=F("sla_deadline")).count()
        sla_breached = sla_total - sla_met

        sla_active_breached = my_tickets.filter(
            status__in=["open", "assigned", "in_progress", "reopened"],
            sla_deadline__lt=now,
        ).count()

        sla_success_pct = (
            round((sla_met / sla_total) * 100, 1) if sla_total > 0 else None
        )

        # ── Recent Tickets  ──
        recent_qs = my_tickets.order_by("-created_at")[:5]
        recent_tickets = []
        for t in recent_qs:
            is_breached = False
            if t.status in ["open", "assigned", "in_progress", "reopened"]:
                if t.sla_deadline and t.sla_deadline < now:
                    is_breached = True
            elif t.resolved_at and t.sla_deadline and t.resolved_at > t.sla_deadline:
                is_breached = True

            recent_tickets.append(
                {
                    "id": t.id,
                    "title": t.title,
                    "priority": t.priority.capitalize(),
                    "status": t.status.replace("_", " "),
                    "sla": "Breached" if is_breached else "Ok",
                    "date": t.created_at.strftime("%Y-%m-%d"),
                }
            )

        # ── My Assets List ──
        my_assets_qs = AssetAssignment.objects.filter(
            employee=request.user, status="active"
        ).select_related("asset", "asset__category")

        my_assets_list = [
            {
                "name": a.asset.asset_name,
                "code": a.asset.asset_code,
                "category": a.asset.category.name if a.asset.category else "—",
                "status": "Assigned",
                "date": str(a.assigned_date),
            }
            for a in my_assets_qs
        ]

        data = {
            "tickets": {
                "my_total": my_total,
                "my_open": my_open,
                "my_in_progress": my_in_progress,
                "my_closed": my_closed,
                "my_assigned": my_assigned,
                "my_resolved": my_resolved,
                "my_reopened": my_reopened,
                "status_distribution": status_distribution,
                "priority_distribution": priority_distribution,
                "sla": {
                    "met": sla_met,
                    "breached": sla_breached,
                    "active_breached": sla_active_breached,
                    "success_pct": sla_success_pct,
                },
                "recent": recent_tickets,
            },
            "assets": {
                "my_assigned_assets": my_assets_qs.count(),
                "list": my_assets_list,
            },
        }
        return Response(data)


class TechnicianDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "technician":
            return Response({"error": "Access denied"}, status=403)

        my_tickets = Ticket.objects.select_related("employee").filter(
            assigned_technician=request.user
        )

        avg_rating = Feedback.objects.filter(
            ticket__assigned_technician=request.user
        ).aggregate(avg=Avg("rating"))
        avg_rating = avg_rating["avg"] if avg_rating["avg"] is not None else 0.0

        resolved_on_time = my_tickets.filter(
            status="closed", resolved_at__lte=F("sla_deadline")
        ).count()
        total_resolved = my_tickets.filter(status="closed").count()

        data = {
            "tickets": {
                "assigned_to_me": my_tickets.filter(
                    status__in=["assigned", "reopened"]
                ).count(),
                "in_progress": my_tickets.filter(status="in_progress").count(),
                "resolved": my_tickets.filter(status="resolved").count(),
            },
            "performance": {
                "average_rating": round(avg_rating, 1),
                "sla_performance_pct": round(
                    (resolved_on_time / total_resolved * 100), 1
                )
                if total_resolved > 0
                else 100.0,
            },
        }
        return Response(data)


class TechnicianPerformanceAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"success": False, "error": "Access denied"}, status=403)
        
        tech_stats = (
            User.objects.filter(role="technician", is_active=True)
            .annotate(
                total_assigned=Count("assigned_tickets"),
                open_count=Count(
                    "assigned_tickets", filter=Q(assigned_tickets__status="open")
                ),
                in_progress_count=Count(
                    "assigned_tickets", filter=Q(assigned_tickets__status="in_progress")
                ),
                resolved_count=Count(
                    "assigned_tickets", filter=Q(assigned_tickets__status="resolved")
                ),
                closed_count=Count(
                    "assigned_tickets", filter=Q(assigned_tickets__status="closed")
                ),
                reopened_count=Count(
                    "assigned_tickets", filter=Q(assigned_tickets__status="reopened")
                ),
                high_critical=Count(
                    "assigned_tickets",
                    filter=Q(
                        assigned_tickets__status__in=[
                            "open",
                            "assigned",
                            "in_progress",
                            "reopened",
                        ],
                        assigned_tickets__priority__in=["high", "critical"],
                    ),
                ),
                avg_rating=Avg("assigned_tickets__feedbacks__rating"),
            )
            .order_by("-total_assigned")
        )

        sla_data = (
            Ticket.objects.filter(
                assigned_technician__isnull=False, resolved_at__isnull=False
            )
            .values("assigned_technician_id")
            .annotate(
                total_sla=Count("id"),
                sla_met=Count("id", filter=Q(resolved_at__lte=F("sla_deadline"))),
            )
        )
        resolution_times = []
        resolved_tickets = (
            Ticket.objects.filter(
                assigned_technician__isnull=False, resolved_at__isnull=False
            )
            .select_related("assigned_technician")
            .only("assigned_technician", "resolved_at", "created_at")
        )

        tech_resolution = {}
        for t in resolved_tickets:
            if t.assigned_technician_id not in tech_resolution:
                tech_resolution[t.assigned_technician_id] = []
            diff = (t.resolved_at - t.created_at).total_seconds()
            tech_resolution[t.assigned_technician_id].append(diff)

        # Calculate average per technician
        res_dict = {}
        for tech_id, times in tech_resolution.items():
            if times:
                avg = sum(times) / len(times) / 3600.0
                res_dict[tech_id] = round(avg, 1)

        # Build lookup dictionaries
        sla_dict = {d["assigned_technician_id"]: d for d in sla_data}

        tech_list = []
        kpis = {
            "total_technicians": tech_stats.count(),
            "total_assigned": 0,
            "in_progress": 0,
            "resolved": 0,
            "sla_met": 0,
            "sla_breached": 0,
        }

        for tech in tech_stats:
            sla = sla_dict.get(tech.id, {})
            total_sla = sla.get("total_sla", 0)
            sla_met_count = sla.get("sla_met", 0)
            sla_breached_count = total_sla - sla_met_count

            active = (
                (tech.open_count or 0)
                + (tech.in_progress_count or 0)
                + (tech.reopened_count or 0)
            )
            if active <= 5:
                workload = "Low"
            elif active <= 10:
                workload = "medium"
            else:
                workload = "High"

            avg_time_rounded = res_dict.get(tech.id)

            tech_list.append(
                {
                    "id": tech.id,
                    "name": f"{tech.first_name} {tech.last_name}",
                    "username": tech.username,
                    "total_assigned": tech.total_assigned or 0,
                    "open": tech.open_count or 0,
                    "in_progress": tech.in_progress_count or 0,
                    "resolved": tech.resolved_count or 0,
                    "closed": tech.closed_count or 0,
                    "reopened": tech.reopened_count or 0,
                    "high_critical": tech.high_critical or 0,
                    "avg_rating": round(tech.avg_rating, 1) if tech.avg_rating else 0.0,
                    "sla_met": sla_met_count,
                    "sla_breached": sla_breached_count,
                    "sla_success_pct": round((sla_met_count / total_sla * 100), 1)
                    if total_sla > 0
                    else None,
                    "avg_resolution_time": avg_time_rounded,
                    "active_tickets": active,
                    "workload": workload,
                }
            )

            kpis["total_assigned"] += tech.total_assigned or 0
            kpis["in_progress"] += tech.in_progress_count or 0
            kpis["resolved"] += tech.resolved_count or 0
            kpis["sla_met"] += sla_met_count
            kpis["sla_breached"] += sla_breached_count

        return Response(
            {
                "success": True,
                "kpis": kpis,
                "technicians": tech_list,
            }
        )


class MyPerformanceAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "technician":
            return Response({"success": False, "error": "Access denied"}, status=403)

        tech = request.user
        my_tickets = Ticket.objects.filter(assigned_technician=tech)

        # Counts
        total = my_tickets.count()
        open_count = my_tickets.filter(status="open").count()
        in_progress = my_tickets.filter(status="in_progress").count()
        resolved = my_tickets.filter(status="resolved").count()
        closed = my_tickets.filter(status="closed").count()
        reopened = my_tickets.filter(status="reopened").count()
        high_critical = my_tickets.filter(
            status__in=["open", "assigned", "in_progress", "reopened"],
            priority__in=["high", "critical"],
        ).count()

        # Rating 
        avg_rating = Feedback.objects.filter(
            ticket__assigned_technician=tech
        ).aggregate(avg=Avg("rating"))
        avg_rating = avg_rating["avg"] if avg_rating["avg"] is not None else 0.0

        # SLA
        sla_tickets = my_tickets.filter(resolved_at__isnull=False)
        total_sla = sla_tickets.count()
        sla_met = sla_tickets.filter(resolved_at__lte=F("sla_deadline")).count()
        sla_breached = total_sla - sla_met

        # Resolution time 
        resolved_list = my_tickets.filter(resolved_at__isnull=False).only(
            "resolved_at", "created_at"
        )

        total_seconds = 0
        count = 0
        for t in resolved_list:
            diff = (t.resolved_at - t.created_at).total_seconds()
            total_seconds += diff
            count += 1

        avg_time = round(total_seconds / 3600.0, 1) if count > 0 else None

        # Workload
        active = open_count + in_progress + reopened
        if active <= 5:
            workload = "Low"
        elif active <= 10:
            workload = "Medium"
        else:
            workload = "High"

        # Chart data
        status_dist = [
            {"name": "Open", "value": open_count},
            {"name": "In Progress", "value": in_progress},
            {"name": "Resolved", "value": resolved},
            {"name": "Closed", "value": closed},
            {"name": "Reopened", "value": reopened},
        ]
        sla_dist = [
            {"name": "Met", "value": sla_met},
            {"name": "Breached", "value": sla_breached},
        ]

        PRIORITY_COLORS = {
            "low": "#22c55e",
            "medium": "#3b82f6",
            "high": "#f59e0b",
            "critical": "#dc2626",
        }
        priority_counts = my_tickets.values("priority").annotate(count=Count("id"))
        priority_distribution = [
            {
                "name": p["priority"].capitalize(),
                "value": p["count"],
                "fill": PRIORITY_COLORS.get(p["priority"], "#64748b"),
            }
            for p in priority_counts
        ]

        recent_qs = my_tickets.order_by("-created_at")[:5]
        recent_tickets = [
            {
                "id": t.id,
                "ticket_number": t.ticket_number,
                "title": t.title,
                "employee_name": t.employee.get_full_name() if t.employee else "—",
                "priority": t.priority,
                "status": t.status,
                "created_at": t.created_at.strftime("%Y-%m-%d"),
            }
            for t in recent_qs
        ]

        return Response(
            {
                "success": True,
                "technician": {
                    "name": f"{tech.first_name} {tech.last_name}",
                    "total_assigned": total,
                    "open": open_count,
                    "in_progress": in_progress,
                    "resolved": resolved,
                    "closed": closed,
                    "reopened": reopened,
                    "high_critical": high_critical,
                    "avg_rating": round(avg_rating, 1),
                    "sla_met": sla_met,
                    "sla_breached": sla_breached,
                    "sla_success_pct": round((sla_met / total_sla * 100), 1)
                    if total_sla > 0
                    else None,
                    "avg_resolution_time": avg_time,
                    "active_tickets": active,
                    "workload": workload,
                    "status_distribution": status_dist,
                    "sla_distribution": sla_dist,
                    "priority_distribution": priority_distribution,
                    "recent_tickets": recent_tickets,
                },
            }
        )



class AISupportInsightsView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        result = generate_insights()
        return Response(result, status=status.HTTP_200_OK)
