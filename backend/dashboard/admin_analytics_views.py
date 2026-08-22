"""
Admin Analytics API — Real PostgreSQL data for the Admin Dashboard.
Day 14 — Complete rewrite with bug fixes.
"""
import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q, F

from django.db.models.functions import TruncMonth

from tickets.models import Ticket
from assets.models import Asset
from feedback.models import Feedback

User = get_user_model()


# ── Color Palettes ──
STATUS_COLORS = {
    'open': '#3b82f6',
    'assigned': '#8b5cf6',
    'in_progress': '#f59e0b',
    'resolved': '#22c55e',
    'reopened': '#ef4444',
    'closed': '#64748b',
}

PRIORITY_COLORS = {
    'low': '#22c55e',
    'medium': '#3b82f6',
    'high': '#f59e0b',
    'critical': '#dc2626',
}

PALETTE = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#64748b', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16', '#a855f7', '#0ea5e9', '#e11d48',
]


class AdminAnalyticsAPIView(APIView):
    """
    ADMIN ONLY — Returns all analytics data for the Admin Dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ── Security: Admin only ──
        if request.user.role != 'admin':
            return Response({"success": False, "error": "Access denied"}, status=403)

        now = timezone.now()

        # ═══════════════════════════════════════
        # KPIs
        # ═══════════════════════════════════════
        total_employees = User.objects.filter(role='employee').count()
        total_technicians = User.objects.filter(role='technician').count()
        inactive_employees = User.objects.filter(role='employee', is_active=False).count()
        inactive_technicians = User.objects.filter(role='technician', is_active=False).count()

        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status='open').count()
        assigned_tickets = Ticket.objects.filter(status='assigned').count()
        in_progress_tickets = Ticket.objects.filter(status='in_progress').count()
        resolved_tickets = Ticket.objects.filter(status='resolved').count()
        closed_tickets = Ticket.objects.filter(status='closed').count()
        reopened_tickets = Ticket.objects.filter(status='reopened').count()

        # Currently active tickets past SLA deadline (for KPI alert)
        sla_breached_active = Ticket.objects.filter(
            status__in=['open', 'assigned', 'in_progress', 'reopened'],
            sla_deadline__lt=now
        ).count()

        # ═══════════════════════════════════════
        # Ticket Status Distribution
        # ═══════════════════════════════════════
        status_counts = Ticket.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        ticket_status = [
            {
                'name': s['status'].replace('_', ' ').title(),
                'value': s['count'],
                'fill': STATUS_COLORS.get(s['status'], '#64748b'),
            }
            for s in status_counts
        ]

        # ═══════════════════════════════════════
        # Priority Distribution
        # ═══════════════════════════════════════
        priority_counts = Ticket.objects.values('priority').annotate(
            count=Count('id')
        ).order_by('priority')

        priority_distribution = [
            {
                'name': p['priority'].capitalize(),
                'value': p['count'],
                'fill': PRIORITY_COLORS.get(p['priority'], '#64748b'),
            }
            for p in priority_counts
        ]

        # ═══════════════════════════════════════
        # Category Distribution
        # ═══════════════════════════════════════
        category_counts = Ticket.objects.exclude(
            category__isnull=True
        ).values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')

        category_distribution = [
            {
                'name': c['category__name'],
                'value': c['count'],
                'fill': PALETTE[i % len(PALETTE)],
            }
            for i, c in enumerate(category_counts)
        ]

        # ═══════════════════════════════════════
        # Department Distribution
        # ═══════════════════════════════════════
        dept_counts = Ticket.objects.exclude(
            department__isnull=True
        ).values('department__name').annotate(
            count=Count('id')
        ).order_by('-count')

        department_distribution = [
            {
                'name': d['department__name'],
                'value': d['count'],
                'fill': PALETTE[i % len(PALETTE)],
            }
            for i, d in enumerate(dept_counts)
        ]

        # ═══════════════════════════════════════
        # Monthly Ticket Trend (last 6 months)
        # ═══════════════════════════════════════
        six_months_ago = now - datetime.timedelta(days=180)

        monthly_trend_raw = Ticket.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        monthly_trend = [
            {
                'name': m['month'].strftime('%B %Y'),
                'value': m['count'],
            }
            for m in monthly_trend_raw
        ]

        # ═══════════════════════════════════════
        # SLA Performance (resolved tickets only)
        # ═══════════════════════════════════════
        sla_resolved = Ticket.objects.filter(
            assigned_technician__isnull=False,
            resolved_at__isnull=False
        )

        sla_total = sla_resolved.count()
        sla_met = sla_resolved.filter(
            resolved_at__lte=F('sla_deadline')
        ).count()
        sla_breached_resolved = sla_total - sla_met

        if sla_total > 0:
            sla_success_pct = round((sla_met / sla_total) * 100, 1)
        else:
            sla_success_pct = None

        # ═══════════════════════════════════════
        # Average Resolution Time (hours)
        # ═══════════════════════════════════════
        resolved_tickets_qs = Ticket.objects.filter(
            resolved_at__isnull=False
        ).only('resolved_at', 'created_at')

        total_seconds = 0
        res_count = 0
        for t in resolved_tickets_qs:
            diff = (t.resolved_at - t.created_at).total_seconds()
            total_seconds += diff
            res_count += 1

        avg_resolution_time = round(total_seconds / 3600.0, 1) if res_count > 0 else None

        # ═══════════════════════════════════════
        # Asset Overview
        # ═══════════════════════════════════════
        asset_counts = Asset.objects.values('status').annotate(
            count=Count('id')
        )
        asset_map = {a['status']: a['count'] for a in asset_counts}

        assets = {
            'total': Asset.objects.count(),
            'available': asset_map.get('available', 0),
            'assigned': asset_map.get('assigned', 0),
            'maintenance': asset_map.get('maintenance', 0),
            'retired': asset_map.get('retired', 0),
        }

        # ═══════════════════════════════════════
        # Feedback Overview
        # ═══════════════════════════════════════
        total_feedback = Feedback.objects.count()
        avg_rating_result = Feedback.objects.aggregate(avg=Avg('rating'))
        avg_rating = round(avg_rating_result['avg'], 1) if avg_rating_result['avg'] is not None else 0.0

        rating_counts = Feedback.objects.values('rating').annotate(
            count=Count('id')
        ).order_by('-rating')

        RATING_COLORS = {
            5: '#22c55e',
            4: '#3b82f6',
            3: '#f59e0b',
            2: '#f97316',
            1: '#dc2626',
        }

        rating_distribution = [
            {
                'name': f"{r['rating']} Star",
                'value': r['count'],
                'fill': RATING_COLORS.get(r['rating'], '#64748b'),
            }
            for r in rating_counts
        ]

        # ═══════════════════════════════════════
        # Recent Tickets (last 8)
        # ═══════════════════════════════════════
        recent_tickets_qs = Ticket.objects.select_related(
            'employee', 'assigned_technician'
        ).order_by('-created_at')[:8]

        recent_tickets = [
            {
                'id': t.id,
                'ticket_number': t.ticket_number,
                'title': t.title,
                'employee_name': t.employee.get_full_name() if t.employee else '—',
                'technician_name': (
                    t.assigned_technician.get_full_name()
                    if t.assigned_technician
                    else 'Unassigned'
                ),
                'priority': t.priority,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
            }
            for t in recent_tickets_qs
        ]

        # ═══════════════════════════════════════
        # Technician Summary (top 5 by active tickets)
        # ═══════════════════════════════════════
        tech_stats = User.objects.filter(
            role='technician', is_active=True
        ).annotate(
            active_tickets=Count(
                'assigned_tickets',
                filter=Q(assigned_tickets__status__in=[
                    'open', 'assigned', 'in_progress', 'reopened'
                ])
            ),
            resolved_count=Count(
                'assigned_tickets',
                filter=Q(assigned_tickets__status__in=['resolved', 'closed'])
            ),
        ).order_by('-active_tickets')[:5]

        # SLA lookup per technician
        tech_sla = Ticket.objects.filter(
            assigned_technician__isnull=False,
            resolved_at__isnull=False
        ).values('assigned_technician_id').annotate(
            total=Count('id'),
            met=Count('id', filter=Q(resolved_at__lte=F('sla_deadline')))
        )
        sla_lookup = {d['assigned_technician_id']: d for d in tech_sla}

        technician_summary = []
        for tech in tech_stats:
            sla = sla_lookup.get(tech.id, {})
            t_total = sla.get('total', 0)
            t_met = sla.get('met', 0)
            active = tech.active_tickets or 0

            if active <= 5:
                workload = 'Low'
            elif active <= 10:
                workload = 'Medium'
            else:
                workload = 'High'

            technician_summary.append({
                'id': tech.id,
                'name': f"{tech.first_name} {tech.last_name}",
                'active_tickets': active,
                'resolved': tech.resolved_count or 0,
                'sla_success_pct': (
                    round((t_met / t_total) * 100, 1) if t_total > 0 else None
                ),
                'workload': workload,
            })

        # ═══════════════════════════════════════
        # Build Response
        # ═══════════════════════════════════════
        return Response({
            'success': True,
            'data': {
                'kpis': {
                    'total_employees': total_employees,
                    'total_technicians': total_technicians,
                    'inactive_employees': inactive_employees,
                    'inactive_technicians': inactive_technicians,
                    'total_tickets': total_tickets,
                    'open_tickets': open_tickets,
                    'assigned_tickets': assigned_tickets,
                    'in_progress_tickets': in_progress_tickets,
                    'resolved_tickets': resolved_tickets,
                    'closed_tickets': closed_tickets,
                    'reopened_tickets': reopened_tickets,
                    'sla_breached': sla_breached_active,
                },
                'ticket_status': ticket_status,
                'priority_distribution': priority_distribution,
                'category_distribution': category_distribution,
                'department_distribution': department_distribution,
                'monthly_trend': monthly_trend,
                'sla': {
                    'met': sla_met,
                    'breached': sla_breached_resolved,
                    'success_pct': sla_success_pct,
                },
                'avg_resolution_time': avg_resolution_time,
                'assets': assets,
                'feedback': {
                    'total': total_feedback,
                    'avg_rating': avg_rating,
                    'rating_distribution': rating_distribution,
                },
                'recent_tickets': recent_tickets,
                'technician_summary': technician_summary,
            },
        })