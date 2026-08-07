"""
Asset models for Smart IT Service Desk
"""

from django.db import models
from django.conf import settings


# Updated Status choices as per your request
ASSET_STATUS_CHOICES = (
    ('available', 'Available'),
    ('assigned', 'Assigned'),
    ('maintenance', 'Maintenance'),
    ('retired', 'Retired'),
)

ASSIGNMENT_STATUS_CHOICES = (
    ('active', 'Active'),
    ('returned', 'Returned'),
)


class AssetCategory(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Category Name')
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Asset Category'
        verbose_name_plural = 'Asset Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Asset(models.Model):
    asset_name = models.CharField(max_length=200, verbose_name='Asset Name')
    asset_code = models.CharField(max_length=50, unique=True, verbose_name='Asset Code')
    
    category = models.ForeignKey(AssetCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    
    brand = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    
    # NEW FIELD ADDED
    serial_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Serial Number')
    
    purchase_date = models.DateField(blank=True, null=True)
    warranty_expiry = models.DateField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=ASSET_STATUS_CHOICES, default='available')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Asset'
        verbose_name_plural = 'Assets'
        ordering = ['asset_code']
    
    def __str__(self):
        return f"{self.asset_code} - {self.asset_name}"


class AssetAssignment(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asset_assignments')
    assigned_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Asset Assignment'
        verbose_name_plural = 'Asset Assignments'
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"{self.asset.asset_code} assigned to {self.employee.get_full_name()}"