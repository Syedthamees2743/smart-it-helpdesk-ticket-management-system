"""
Views for Department Module
"""

from rest_framework import viewsets
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdminOrReadOnly


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    search_fields = ('name', 'description')
    
    ordering_fields = ('name', 'created_at', 'status')
    
    ordering = ('name',)