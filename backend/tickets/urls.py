from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_media import serve_media_file  # ← ADD THIS

router = DefaultRouter()

router.register(r'tickets', views.TicketViewSet, basename='ticket')
router.register(r'categories', views.IssueCategoryViewSet, basename='category')

comments_router = DefaultRouter()
comments_router.register(r'comments', views.TicketCommentViewSet, basename='ticket-comment')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/analyze-complaint/', views.AIAnalyzeComplaintView.as_view(), name='ai-analyze-complaint'),
    path('ai/troubleshoot/', views.AITroubleshootView.as_view(), name='ai-troubleshoot'),
    path('tickets/<int:ticket_pk>/', include(comments_router.urls)),
    
    # ← ADD THIS LINE - Media proxy endpoint
    path('media/<path:path>', serve_media_file, name='serve-media'),
]