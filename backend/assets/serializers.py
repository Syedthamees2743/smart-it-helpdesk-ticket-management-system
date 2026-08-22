# serializers.py
from rest_framework import serializers
from .models import AssetCategory, Asset, AssetAssignment


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = "__all__"


class AssetListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    current_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            "id",
            "asset_code",
            "asset_name",
            "category_name",
            "brand",
            "model",
            "serial_number",
            "purchase_date",
            "warranty_expiry",
            "status",
            "current_assignment",
        ]

    def get_current_assignment(self, obj):
        assignment = (
            obj.assignments.filter(status="active")
            .select_related(
                "employee",
                "employee__employee_profile",
                "employee__employee_profile__department",
            )
            .first()
        )
        if not assignment:
            return None
        employee = assignment.employee
        employee_name = employee.get_full_name() or employee.username
        employee_id = None
        if hasattr(employee, "employee_profile"):
            employee_id = employee.employee_profile.employee_id
        employee_department = None
        if (
            hasattr(employee, "employee_profile")
            and employee.employee_profile.department
        ):
            employee_department = employee.employee_profile.department.name
        return {
            "id": assignment.id,
            "employee_name": employee_name,
            "employee_id": employee_id,
            "employee_department": employee_department,
            "assigned_date": assignment.assigned_date,
            "status": assignment.status,
        }


class AssetDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    current_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        purchase_date = attrs.get("purchase_date")
        warranty_expiry = attrs.get("warranty_expiry")
        if purchase_date and warranty_expiry:
            if warranty_expiry <= purchase_date:
                raise serializers.ValidationError(
                    {
                        "warranty_expiry": "Warranty expiry date must be after the purchase date."
                    }
                )
        return attrs

    def get_current_assignment(self, obj):
        assignment = (
            obj.assignments.filter(status="active")
            .select_related(
                "employee",
                "employee__employee_profile",
                "employee__employee_profile__department",
            )
            .first()
        )
        if not assignment:
            return None
        employee = assignment.employee
        employee_name = employee.get_full_name() or employee.username
        employee_id = None
        if hasattr(employee, "employee_profile"):
            employee_id = employee.employee_profile.employee_id
        employee_department = None
        if (
            hasattr(employee, "employee_profile")
            and employee.employee_profile.department
        ):
            employee_department = employee.employee_profile.department.name
        return {
            "id": assignment.id,
            "employee_name": employee_name,
            "employee_id": employee_id,
            "employee_department": employee_department,
            "assigned_date": assignment.assigned_date,
            "status": assignment.status,
        }


# ⭐ UPDATED - Assignment List with ALL asset fields
class AssetAssignmentListSerializer(serializers.ModelSerializer):
    asset_id = serializers.IntegerField(source="asset.id", read_only=True)
    asset_code = serializers.CharField(source="asset.asset_code", read_only=True)
    asset_name = serializers.CharField(source="asset.asset_name", read_only=True)

    # ⭐ NEW FIELDS for My Assets cards
    category_name = serializers.CharField(source="asset.category.name", read_only=True)
    brand = serializers.CharField(source="asset.brand", read_only=True)
    model = serializers.CharField(source="asset.model", read_only=True)
    serial_number = serializers.CharField(source="asset.serial_number", read_only=True)
    purchase_date = serializers.DateField(source="asset.purchase_date", read_only=True)
    warranty_expiry = serializers.DateField(
        source="asset.warranty_expiry", read_only=True
    )
    asset_status = serializers.CharField(source="asset.status", read_only=True)

    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()

    class Meta:
        model = AssetAssignment
        fields = [
            "id",
            "asset_id",
            "asset_code",
            "asset_name",
            "category_name",
            "brand",
            "model",
            "serial_number",
            "purchase_date",
            "warranty_expiry",
            "asset_status",
            "employee_name",
            "employee_id",
            "employee_department",
            "assigned_date",
            "return_date",
            "status",
        ]

    def get_employee_name(self, obj):
        employee = obj.employee
        full_name = employee.get_full_name()
        return full_name if full_name else employee.username

    def get_employee_id(self, obj):
        employee = obj.employee
        if hasattr(employee, "employee_profile"):
            return employee.employee_profile.employee_id
        return None

    def get_employee_department(self, obj):
        employee = obj.employee
        if (
            hasattr(employee, "employee_profile")
            and employee.employee_profile.department
        ):
            return employee.employee_profile.department.name
        return None


# Assignment Detail (for Employee Asset Details page)
class AssetAssignmentDetailSerializer(serializers.ModelSerializer):
    asset_id = serializers.IntegerField(source="asset.id", read_only=True)
    asset_code = serializers.CharField(source="asset.asset_code", read_only=True)
    asset_name = serializers.CharField(source="asset.asset_name", read_only=True)
    category_name = serializers.CharField(source="asset.category.name", read_only=True)
    brand = serializers.CharField(source="asset.brand", read_only=True)
    model = serializers.CharField(source="asset.model", read_only=True)
    serial_number = serializers.CharField(source="asset.serial_number", read_only=True)
    purchase_date = serializers.DateField(source="asset.purchase_date", read_only=True)
    warranty_expiry = serializers.DateField(
        source="asset.warranty_expiry", read_only=True
    )
    asset_status = serializers.CharField(source="asset.status", read_only=True)

    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()

    class Meta:
        model = AssetAssignment
        fields = [
            "id",
            "asset_id",
            "asset_code",
            "asset_name",
            "category_name",
            "brand",
            "model",
            "serial_number",
            "purchase_date",
            "warranty_expiry",
            "asset_status",
            "employee_name",
            "employee_id",
            "employee_department",
            "assigned_date",
            "return_date",
            "status",
        ]

    def get_employee_name(self, obj):
        employee = obj.employee
        full_name = employee.get_full_name()
        return full_name if full_name else employee.username

    def get_employee_id(self, obj):
        employee = obj.employee
        if hasattr(employee, "employee_profile"):
            return employee.employee_profile.employee_id
        return None

    def get_employee_department(self, obj):
        employee = obj.employee
        if (
            hasattr(employee, "employee_profile")
            and employee.employee_profile.department
        ):
            return employee.employee_profile.department.name
        return None
