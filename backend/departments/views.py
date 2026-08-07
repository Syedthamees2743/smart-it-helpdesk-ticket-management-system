"""
Views for Department Module
"""

from rest_framework import viewsets
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdminOrReadOnly


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Handles all CRUD operations for Departments automatically:
    - GET /api/departments/ (List all)
    - POST /api/departments/ (Create new - Admin only)
    - GET /api/departments/{id}/ (Get one)
    - PUT /api/departments/{id}/ (Update - Admin only)
    - DELETE /api/departments/{id}/ (Delete - Admin only)
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Search configuration: Allows ?search=IT in the URL
    search_fields = ('name', 'description')
    
    # Ordering configuration: Allows ?ordering=name or ?ordering=-created_at
    ordering_fields = ('name', 'created_at', 'status')
    
    # Default ordering when no ?ordering is provided
    ordering = ('name',)