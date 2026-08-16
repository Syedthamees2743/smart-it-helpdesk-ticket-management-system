"""
URL patterns for Ticket Module
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register the Ticket ViewSet
# This creates URLs like /api/tickets/tickets/ and /api/tickets/tickets/1/
router.register(r'tickets', views.TicketViewSet, basename='ticket')

# Keep the categories from Day 3
router.register(r'categories', views.IssueCategoryViewSet, basename='category')

#Nested router for comments (links comments to specific ticket)
comments_router = DefaultRouter()
comments_router.register(r'comments', views.TicketCommentViewSet, basename='ticket-comment')


urlpatterns = [
    path('', include(router.urls)),
    path('ai/analyze-complaint/', views.AIAnalyzeComplaintView.as_view(), name='ai-analyze-complaint'),
    path('ai/troubleshoot/', views.AITroubleshootView.as_view(), name='ai-troubleshoot'),
    path('tickets/<int:ticket_pk>/', include(comments_router.urls)),
]