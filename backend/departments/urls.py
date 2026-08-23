from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.DepartmentViewSet, basename='department')

urlpatterns = [
    # Public endpoint for signup forms (no auth required)
    path('public/', views.PublicDepartmentListView.as_view(), name='public-departments'),
    
    # Protected endpoints (auth required)
    path('', include(router.urls)),
]