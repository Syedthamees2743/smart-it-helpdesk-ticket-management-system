"""
Views for Department Module
"""

from rest_framework import viewsets
from .models import Department
from .serializers import DepartmentSerializer
from accounts.permissions import IsAdminOrReadOnly
from rest_framework import generics, permissions
from rest_framework.response import Response


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

    search_fields = ('name', 'description')
    
    ordering_fields = ('name', 'created_at', 'status')
    
    ordering = ('name',)


class PublicDepartmentListView(generics.ListAPIView):
    """
    Public endpoint for signup forms.
    Returns only active departments with id and name.
    No authentication required.
    """
    queryset = Department.objects.filter(status='active')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_serializer(self, *args, **kwargs):
        # Use a minimal serializer for public access
        from rest_framework import serializers
        
        class MinimalDepartmentSerializer(serializers.ModelSerializer):
            class Meta:
                model = Department
                fields = ['id', 'name']
        
        return MinimalDepartmentSerializer(*args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [{'id': dept.id, 'name': dept.name} for dept in queryset]
        return Response({
            'success': True,
            'count': len(data),
            'data': data
        })