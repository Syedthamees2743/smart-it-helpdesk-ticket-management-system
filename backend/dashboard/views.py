from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q, F

from tickets.models import Ticket
from assets.models import Asset, AssetAssignment
from feedback.models import Feedback

User = get_user_model()


class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Access denied"}, status=403)

        now = timezone.now()
        
        # OPTIMIZATION: select_related('department', 'assigned_technician', 'employee')
        # This prevents N+1 query issues when counting statuses.
        tickets = Ticket.objects.select_related('department', 'assigned_technician', 'employee').all()
        
        data = {
            "users": {
                "total_employees": User.objects.filter(role='employee', is_active=True).count(),
                "total_technicians": User.objects.filter(role='technician', is_active=True).count(),
                "total_departments": 10, # Replace with Department.objects.count() if you imported it
            },
            "tickets": {
                "total": tickets.count(),
                "open": tickets.filter(status='open').count(),
                "assigned": tickets.filter(status='assigned').count(),
                "in_progress": tickets.filter(status='in_progress').count(),
                "resolved": tickets.filter(status='resolved').count(),
                "closed": tickets.filter(status='closed').count(),
                "reopened": tickets.filter(status='reopened').count(),
                "sla_breached": tickets.filter(
                    status__in=['open', 'assigned', 'in_progress', 'reopened'],
                    sla_deadline__lt=now
                ).count(),
            },
            "assets": {
                "total": Asset.objects.count(),
                "available": Asset.objects.filter(status='available').count(),
                "assigned": Asset.objects.filter(status='assigned').count(),
                "maintenance": Asset.objects.filter(status='maintenance').count(),
            },
            "technician_ratings": list(
                User.objects.filter(role='technician').annotate(
                    avg_rating=Avg('assigned_tickets__feedbacks__rating')
                ).values('id', 'first_name', 'last_name', 'avg_rating').order_by('-avg_rating')[:5]
            )
        }
        return Response(data)


class EmployeeDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'employee':
            return Response({"error": "Access denied"}, status=403)

        # OPTIMIZATION: select_related prevents extra DB hits
        my_tickets = Ticket.objects.select_related('assigned_technician').filter(employee=request.user)

        data = {
            "tickets": {
                "my_total": my_tickets.count(),
                "my_open": my_tickets.filter(status='open').count(),
                "my_in_progress": my_tickets.filter(status='in_progress').count(),
                "my_closed": my_tickets.filter(status='closed').count(),
            },
            "assets": {
                "my_assigned_assets": AssetAssignment.objects.filter(
                    employee=request.user, 
                    status='active'
                ).select_related('asset').count()
            }
        }
        return Response(data)


class TechnicianDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'technician':
            return Response({"error": "Access denied"}, status=403)

        # OPTIMIZATION: select_related('employee') for fast looping
        my_tickets = Ticket.objects.select_related('employee').filter(assigned_technician=request.user)
        
        avg_rating = Feedback.objects.filter(ticket__assigned_technician=request.user).aggregate(avg=Avg('rating'))['avg']
        
        # SLA Performance: How many did I resolve before the deadline?
        resolved_on_time = my_tickets.filter(status='closed', resolved_at__lte=F('sla_deadline')).count()
        total_resolved = my_tickets.filter(status='closed').count()

        data = {
            "tickets": {
                "assigned_to_me": my_tickets.filter(status__in=['assigned', 'reopened']).count(),
                "in_progress": my_tickets.filter(status='in_progress').count(),
                "resolved": my_tickets.filter(status='resolved').count(),
            },
            "performance": {
                "average_rating": round(avg_rating, 1) if avg_rating else 0.0,
                "sla_performance_pct": round((resolved_on_time / total_resolved * 100), 1) if total_resolved > 0 else 100.0
            }
        }
        return Response(data)