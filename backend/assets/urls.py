from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Categories: /api/assets/categories/
router.register(r'categories', views.AssetCategoryViewSet, basename="asset-category")

# Assets: /api/assets/ (Empty string means it attaches directly to the base URL)
router.register(r'', views.AssetViewSet, basename="asset")

# View Assignments: /api/assets/assignments/
router.register(r'assignments', views.AssetAssignmentViewSet, basename="asset-assignment")

# Assign/Return Actions: /api/assets/manage/assign/ and /return/
router.register(r'manage', views.AssetManagementViewSet, basename="asset-manage")

urlpatterns = [
    path("", include(router.urls)),
]