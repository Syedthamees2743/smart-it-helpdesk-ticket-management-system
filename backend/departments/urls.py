"""
URL patterns for Department Module
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router automatically generates URLs for the ViewSet
router = DefaultRouter()
router.register(r'', views.DepartmentViewSet)

# The empty string r'' means the URLs will be exactly what we specify in core/urls.py
urlpatterns = [
    path('', include(router.urls)),
]