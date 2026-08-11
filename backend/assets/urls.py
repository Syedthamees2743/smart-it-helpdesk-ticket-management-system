from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# 1. Specific paths first
router.register(r'categories', views.AssetCategoryViewSet, basename="asset-category")
router.register(r'assignments', views.AssetAssignmentViewSet, basename="asset-assignment")
router.register(r'manage', views.AssetManagementViewSet, basename="asset-manage")

# 2. Catch-all empty string MUST BE LAST
router.register(r'', views.AssetViewSet, basename="asset")

urlpatterns = [
    path("", include(router.urls)),
]