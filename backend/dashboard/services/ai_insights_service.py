"""
AI Support Insights Service for Admin — Enhanced Version.
Collects REAL PostgreSQL statistics with trend comparison,
user capacity analysis, and sends to Hugging Face for deep analysis.
"""

import json
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, F

from tickets.models import Ticket

User = get_user_model()


def collect_support_statistics():
    """Collect real aggregated statistics with trend comparison and user capacity."""
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    # ── User Capacity Data ──
    total_employees = User.objects.filter(role='employee').count()
    active_employees = User.objects.filter(role='employee', is_active=True).count()
    inactive_employees = total_employees - active_employees

    total_technicians = User.objects.filter(role='technician').count()
    active_technicians = User.objects.filter(role='technician', is_active=True).count()
    inactive_technicians = total_technicians - active_technicians

    # ── Current Period (last 30 days) ──
    current_qs = Ticket.objects.filter(created_at__gte=thirty_days_ago)
    current_total = current_qs.count()
    current_open = current_qs.filter(status='open').count()
    current_resolved = current_qs.filter(status='resolved').count()
    current_reopened = current_qs.filter(status='reopened').count()
    current_closed = current_qs.filter(status='closed').count()

    # ── Previous Period (30-60 days ago) for comparison ──
    previous_qs = Ticket.objects.filter(
        created_at__gte=sixty_days_ago,
        created_at__lt=thirty_days_ago
    )
    previous_total = previous_qs.count()

    # ── All Time Counts ──
    all_tickets = Ticket.objects.count()
    open_tickets = Ticket.objects.filter(status='open').count()
    in_progress_tickets = Ticket.objects.filter(status='in_progress').count()
    resolved_tickets = Ticket.objects.filter(status='resolved').count()
    reopened_tickets = Ticket.objects.filter(status='reopened').count()
    closed_tickets = Ticket.objects.filter(status='closed').count()

    # ── Priority Breakdown ──
    priority_counts = Ticket.objects.values('priority').annotate(count=Count('id'))
    priority_breakdown = {p['priority']: p['count'] for p in priority_counts}

    # ── Top Categories ──
    category_counts = Ticket.objects.exclude(
        category__isnull=True
    ).values('category__name').annotate(count=Count('id')).order_by('-count')[:5]
    top_categories = [{'name': c['category__name'], 'count': c['count']} for c in category_counts]

    # ── Top Departments ──
    dept_counts = Ticket.objects.exclude(
        department__isnull=True
    ).values('department__name').annotate(count=Count('id')).order_by('-count')[:5]
    top_departments = [{'name': d['department__name'], 'count': d['count']} for d in dept_counts]

    # ── SLA Info ──
    sla_breached_active = Ticket.objects.filter(
        status__in=['open', 'assigned', 'in_progress', 'reopened'],
        sla_deadline__lt=now
    ).count()

    sla_approaching = Ticket.objects.filter(
        status__in=['open', 'assigned', 'in_progress', 'reopened'],
        sla_deadline__gt=now,
        sla_deadline__lte=now + timedelta(hours=4)
    ).count()

    sla_resolved = Ticket.objects.filter(
        assigned_technician__isnull=False,
        resolved_at__isnull=False
    )
    sla_total = sla_resolved.count()
    sla_met = sla_resolved.filter(resolved_at__lte=F('sla_deadline')).count()

    # ── Technician Workload ──
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

    technician_workload = [
        {
            'name': f"{t.first_name} {t.last_name}",
            'active_tickets': t.active_tickets or 0,
            'resolved': t.resolved_count or 0,
        }
        for t in tech_stats
    ]

    overloaded_techs = [t for t in technician_workload if t['active_tickets'] >= 8]
    zero_workload_techs = [t for t in technician_workload if t['active_tickets'] == 0 and t['resolved'] == 0]

    # ── Average Resolution Time ──
    resolved_qs = Ticket.objects.filter(resolved_at__isnull=False)
    total_seconds = 0
    res_count = 0
    for t in resolved_qs.only('resolved_at', 'created_at'):
        total_seconds += (t.resolved_at - t.created_at).total_seconds()
        res_count += 1
    avg_resolution_hours = round(total_seconds / 3600.0, 1) if res_count > 0 else None

    # ── Critical/High Open Tickets ──
    urgent_open = Ticket.objects.filter(
        status__in=['open', 'assigned', 'in_progress', 'reopened'],
        priority__in=['critical', 'high']
    ).count()

    # ── Tickets per employee ratio ──
    tickets_per_employee = round(all_tickets / active_employees, 1) if active_employees > 0 else None
    tickets_per_technician = round(all_tickets / active_technicians, 1) if active_technicians > 0 else None

    # ── Trend percentage ──
    trend_pct = None
    if previous_total > 0:
        trend_pct = round(((current_total - previous_total) / previous_total) * 100, 1)
    elif current_total > 0 and previous_total == 0:
        trend_pct = 100.0

    stats = {
        'user_capacity': {
            'total_employees': total_employees,
            'active_employees': active_employees,
            'inactive_employees': inactive_employees,
            'total_technicians': total_technicians,
            'active_technicians': active_technicians,
            'inactive_technicians': inactive_technicians,
            'tickets_per_employee': tickets_per_employee,
            'tickets_per_technician': tickets_per_technician,
            'overloaded_technicians': len(overloaded_techs),
            'idle_technicians': len(zero_workload_techs),
        },
        'all_time': {
            'total_tickets': all_tickets,
            'open_tickets': open_tickets,
            'in_progress_tickets': in_progress_tickets,
            'resolved_tickets': resolved_tickets,
            'reopened_tickets': reopened_tickets,
            'closed_tickets': closed_tickets,
        },
        'current_period': {
            'total': current_total,
            'open': current_open,
            'resolved': current_resolved,
            'reopened': current_reopened,
            'closed': current_closed,
        },
        'previous_period': {
            'total': previous_total,
        },
        'trend_percent': trend_pct,
        'priority': priority_breakdown,
        'top_categories': top_categories,
        'top_departments': top_departments,
        'sla': {
            'breached_active': sla_breached_active,
            'approaching_deadline': sla_approaching,
            'met': sla_met,
            'total_resolved': sla_total,
            'success_pct': round((sla_met / sla_total) * 100, 1) if sla_total > 0 else None,
        },
        'technician_workload': technician_workload,
        'overloaded_technicians': overloaded_techs,
        'idle_technicians': zero_workload_techs,
        'urgent_open_tickets': urgent_open,
        'avg_resolution_hours': avg_resolution_hours,
    }

    return stats


def build_insights_messages(stats):
    """Build enhanced chat messages for deeper AI analysis."""
    return [
        {
            "role": "system",
            "content": """You are a senior IT support operations analyst providing an executive briefing to an IT administrator.

Your analysis MUST be:
1. DATA-DRIVEN — always reference specific numbers from the statistics
2. ACTIONABLE — tell the admin WHAT to do, not just what is happening
3. CATEGORIZED — organize insights into clear areas
4. CONCISE — keep each insight to 1-2 sentences maximum
5. HONEST — if data is low/zero, say so clearly
6. CONTEXTUAL — consider user_capacity data when making recommendations

Categorize your insights into these types:
- SLA_RISK: SLA breaches or approaching deadlines
- WORKLOAD: Technician capacity and distribution issues
- TREND: Volume changes (up/down) over time
- PRIORITY: Critical/high priority ticket concerns
- USER_MGMT: Employee/technician count issues, inactive users, capacity gaps
- RECOMMENDATION: Specific actions the admin should take

Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary with key numbers",
  "insights": [
    {"type": "SLA_RISK", "text": "Specific SLA insight with numbers"},
    {"type": "WORKLOAD", "text": "Specific workload insight"},
    {"type": "USER_MGMT", "text": "Specific user management insight"},
    {"type": "TREND", "text": "Specific trend with percentage"},
    {"type": "PRIORITY", "text": "Specific priority concern"},
    {"type": "RECOMMENDATION", "text": "Specific recommended action"}
  ]
}

Rules:
- Use EXACT numbers from the data (e.g., "3 tickets" not "several tickets")
- Check user_capacity section: if inactive_employees > 0, mention it
- If overloaded_technicians > 0, flag workload imbalance
- If idle_technicians > 0 and overloaded_technicians > 0, suggest rebalancing
- If active_technicians == 0 but open_tickets > 0, this is CRITICAL — no one to handle tickets
- If tickets_per_technician is very high (>20), suggest hiring
- If a category has no data, skip it
- Include 5-8 insights total
- Prioritize CRITICAL issues first (no technicians, SLA breaches, overloaded staff)
- Do NOT mention individual employee/technician names for privacy"""
        },
        {
            "role": "user",
            "content": f"Analyze these IT support statistics and provide an executive briefing:\n\n{json.dumps(stats, indent=2)}"
        }
    ]


def parse_ai_response(content):
    """Parse and categorize AI insights response."""
    try:
        text = content.strip()

        # Remove Qwen3 <think/> blocks
        while '<think' in text:
            think_start = text.find('<think')
            think_end = text.find('</think>')
            if think_end == -1:
                text = text[:think_start].strip()
            else:
                text = (text[:think_start] + text[think_end + 8:]).strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            candidate = text[start:end + 1]
            try:
                data = json.loads(candidate)
            except json.JSONDecodeError:
                data = None
        else:
            data = None

        if data is None:
            lower_text = text.lower()
            summary = 'Support operations need attention based on current workload, SLA pressures, and backlog trends.'
            insights = []

            if 'sla' in lower_text or 'deadline' in lower_text or 'breached' in lower_text:
                insights.append({
                    'type': 'SLA_RISK',
                    'text': 'SLA deadlines are at risk for active tickets and should be reviewed immediately to prevent further breaches.',
                    'icon': 'shield',
                    'color': '#dc2626',
                })
            if 'high' in lower_text or 'critical' in lower_text or 'priority' in lower_text:
                insights.append({
                    'type': 'PRIORITY',
                    'text': 'High-priority tickets remain elevated and require faster routing or escalation to reduce operational risk.',
                    'icon': 'exclamation-triangle',
                    'color': '#ef4444',
                })
            if 'workload' in lower_text or 'technician' in lower_text or 'capacity' in lower_text or 'backlog' in lower_text:
                insights.append({
                    'type': 'WORKLOAD',
                    'text': 'Technician workload and backlog should be balanced to prevent queue growth and delayed resolutions.',
                    'icon': 'users',
                    'color': '#f59e0b',
                })
            if 'inactive' in lower_text or 'user' in lower_text or 'employee' in lower_text:
                insights.append({
                    'type': 'USER_MGMT',
                    'text': 'Inactive user accounts should be reviewed — deactivate unused accounts or reactivate needed ones to maintain full team capacity.',
                    'icon': 'user-slash',
                    'color': '#64748b',
                })
            if 'trend' in lower_text or 'growing' in lower_text or 'increasing' in lower_text or 'rising' in lower_text:
                insights.append({
                    'type': 'TREND',
                    'text': 'Current ticket volume indicates a rising trend that needs monitoring and proactive capacity planning.',
                    'icon': 'chart-line',
                    'color': '#3b82f6',
                })
            if not insights:
                insights.append({
                    'type': 'RECOMMENDATION',
                    'text': 'Review queue priorities and technician capacity to keep the support operation stable and responsive.',
                    'icon': 'lightbulb',
                    'color': '#8b5cf6',
                })

            return {
                'summary': summary,
                'insights': insights[:8],
            }

        summary = str(data.get('summary', '')).strip()
        raw_insights = data.get('insights', [])

        if not isinstance(raw_insights, list):
            raw_insights = [raw_insights]

        valid_types = ['SLA_RISK', 'WORKLOAD', 'TREND', 'PRIORITY', 'USER_MGMT', 'RECOMMENDATION']
        type_icons = {
            'SLA_RISK': 'shield',
            'WORKLOAD': 'users',
            'TREND': 'chart-line',
            'PRIORITY': 'exclamation-triangle',
            'USER_MGMT': 'user-slash',
            'RECOMMENDATION': 'lightbulb',
        }
        type_colors = {
            'SLA_RISK': '#dc2626',
            'WORKLOAD': '#f59e0b',
            'TREND': '#3b82f6',
            'PRIORITY': '#ef4444',
            'USER_MGMT': '#64748b',
            'RECOMMENDATION': '#8b5cf6',
        }

        insights = []
        for item in raw_insights:
            if isinstance(item, dict):
                ins_type = str(item.get('type', 'RECOMMENDATION')).upper()
                ins_text = str(item.get('text', '')).strip()
                if ins_text and ins_type in valid_types:
                    insights.append({
                        'type': ins_type,
                        'text': ins_text,
                        'icon': type_icons.get(ins_type, 'lightbulb'),
                        'color': type_colors.get(ins_type, '#6b7280'),
                    })
            elif isinstance(item, str) and item.strip():
                insights.append({
                    'type': 'RECOMMENDATION',
                    'text': item.strip(),
                    'icon': 'lightbulb',
                    'color': '#8b5cf6',
                })

        if not summary and not insights:
            return None

        return {
            'summary': summary or 'Support operations overview generated.',
            'insights': insights[:8],
        }

    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        return None


def generate_insights():
    """Main entry point: Collect real stats and generate enhanced AI insights."""
    api_key = getattr(settings, 'HF_TOKEN', '')

    if not api_key:
        return {
            'success': False,
            'error': 'AI service is not configured. Please contact your administrator.'
        }

    try:
        from huggingface_hub import InferenceClient

        stats = collect_support_statistics()
        messages = build_insights_messages(stats)
        model = getattr(settings, 'HUGGINGFACE_AI_MODEL', 'Qwen/Qwen3-8B:nscale')

        client = InferenceClient(api_key=api_key)

        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=700,
            temperature=0.4,
        )

        message = completion.choices[0].message
        ai_text = getattr(message, 'content', None) or ''
        reasoning = getattr(message, 'reasoning_content', None) or ''

        combined = ai_text.strip()
        if len(combined) < 10:
            combined = reasoning.strip()

        if not combined or len(combined) < 10:
            return {
                'success': False,
                'error': 'AI could not generate insights. Please try again later.'
            }

        parsed = parse_ai_response(combined)

        if not parsed:
            return {
                'success': False,
                'error': 'AI response was unclear. Please try again later.'
            }

        return {
            'success': True,
            'data': parsed
        }

    except Exception as e:
        error_msg = str(e)

        if 'loading' in error_msg.lower() or '503' in error_msg:
            friendly = 'AI model is loading. Please try again in 30 seconds.'
        elif '429' in error_msg or 'rate' in error_msg.lower():
            friendly = 'AI service is busy. Please wait a moment and try again.'
        elif 'timeout' in error_msg.lower():
            friendly = 'AI service timed out. Please try again later.'
        elif 'auth' in error_msg.lower() or 'token' in error_msg.lower() or '401' in error_msg:
            friendly = 'AI API key is invalid. Please contact your administrator.'
        elif 'connect' in error_msg.lower():
            friendly = 'Could not reach AI service. Check your internet connection.'
        else:
            friendly = 'AI insights are currently unavailable. Please try again later.'

        return {
            'success': False,
            'error': friendly
        }