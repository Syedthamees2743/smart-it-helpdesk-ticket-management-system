from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets
from django.utils import timezone
from django.contrib.auth import get_user_model
from notifications.services import send_asset_assigned_notification, send_asset_returned_notification
from .models import AssetCategory, Asset, AssetAssignment
from .serializers import (
    AssetCategorySerializer, AssetListSerializer, 
    AssetDetailSerializer, AssetAssignmentListSerializer # <-- Import the new one
)
from accounts.permissions import IsAdmin, IsAdminOrReadOnly

User = get_user_model()

class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ('name',)
    ordering_fields = ('name',)

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    permission_classes = [IsAdmin]
    search_fields = ('asset_code', 'asset_name', 'brand', 'model', 'serial_number')
    filterset_fields = ('status', 'category')
    ordering_fields = ('asset_code', 'created_at', 'status')

    def get_serializer_class(self):
        if self.action == 'list':
            return AssetListSerializer
        return AssetDetailSerializer
    
# --- FIX THIS VIEWSET ---
class AssetAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Employees view their assigned assets. Admins view all assignments.
    """
    # Use the NEW serializer here!
    serializer_class = AssetAssignmentListSerializer 
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return AssetAssignment.objects.all()
        elif user.role == 'employee':
            return AssetAssignment.objects.filter(employee=user, status='active')
        return AssetAssignment.objects.none()

class AssetManagementViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Only admins can manage asset assignments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {"message": "Invalid request. Please use POST /api/assets/manage/assign/ or POST /api/assets/manage/return/"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=['post'], url_path='assign')
    def assign_asset(self, request):
        asset_id = request.data.get('asset_id')
        employee_id = request.data.get('employee_id')

        if not asset_id or not employee_id:
            raise ValidationError({"error": "asset_id and employee_id are required."})

        try:
            asset = Asset.objects.get(id=asset_id)
        except Asset.DoesNotExist:
            raise ValidationError({"error": "Asset not found."})

        if asset.status != 'available':
            raise ValidationError({"error": f"Asset is currently '{asset.status}'. Only 'available' assets can be assigned."})

        try:
            employee = User.objects.get(id=employee_id, role='employee')
        except User.DoesNotExist:
            raise ValidationError({"error": "Employee not found or user is not an employee."})

        AssetAssignment.objects.create(
            asset=asset,
            employee=employee,
            assigned_date=timezone.now().date(),
            status='active'
        )
        asset.status = 'assigned'
        asset.save()

        send_asset_assigned_notification(AssetAssignment.objects.get(asset=asset, employee=employee))

        return Response({"message": f"Asset {asset.asset_code} assigned to {employee.get_full_name()}."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='return')
    def return_asset(self, request):
        assignment_id = request.data.get('assignment_id')

        if not assignment_id:
            raise ValidationError({"error": "assignment_id is required."})

        try:
            assignment = AssetAssignment.objects.get(id=assignment_id, status='active')
        except AssetAssignment.DoesNotExist:
            raise ValidationError({"error": "Active assignment not found."})

        assignment.status = 'returned'
        assignment.return_date = timezone.now().date()
        assignment.save()

        assignment.asset.status = 'available'
        assignment.asset.save()

        send_asset_returned_notification(assignment)

        return Response({"message": f"Asset {assignment.asset.asset_code} returned successfully."}, status=status.HTTP_200_OK)
