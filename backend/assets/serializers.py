"""
Serializers for Asset Module
"""

from rest_framework import serializers
from .models import AssetCategory, Asset
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .models import AssetCategory, Asset, AssetAssignment
from django.core.exceptions import ValidationError



class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'


class AssetListSerializer(serializers.ModelSerializer):
    """Used for listing assets (shows category name instead of ID)"""
    category_name = serializers.StringRelatedField(source='category', read_only=True)

    class Meta:
        model = Asset
        fields = ('id', 'asset_code', 'asset_name', 'category_name', 'brand', 'model', 'status', 'warranty_expiry')


class AssetDetailSerializer(serializers.ModelSerializer):
    """Used for full asset details"""
    category_name = serializers.StringRelatedField(source='category', read_only=True)

    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    # VALIDATION: Warranty date must be AFTER purchase date
    def validate(self, attrs):
        purchase_date = attrs.get('purchase_date')
        warranty_expiry = attrs.get('warranty_expiry')
        
        # If both dates are provided, check logic
        if purchase_date and warranty_expiry:
            if warranty_expiry <= purchase_date:
                raise serializers.ValidationError({"warranty_expiry": "Warranty expiry date must be after the purchase date."})
        
        return attrs

    
# --- ADD THIS NEW SERIALIZER ---
class AssetAssignmentListSerializer(serializers.ModelSerializer):
    """
    Used to list Asset Assignments.
    Uses 'source=' to dig into related models (Asset and User).
    """
    asset_code = serializers.CharField(source='asset.asset_code', read_only=True)
    asset_name = serializers.CharField(source='asset.asset_name', read_only=True)
    employee_name = serializers.StringRelatedField(source='employee', read_only=True)

    class Meta:
        model = AssetAssignment
        fields = ('id', 'asset_code', 'asset_name', 'employee_name', 'assigned_date', 'return_date', 'status')