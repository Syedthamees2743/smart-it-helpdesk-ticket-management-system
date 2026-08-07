"""
Admin configuration for assets app
"""

from django.contrib import admin
from .models import AssetCategory, Asset, AssetAssignment


@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    """
    Admin configuration for AssetCategory model.
    """
    
    list_display = ('name', 'description')
    list_display_links = ('name',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
    )


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    """
    Admin configuration for Asset model.
    """
    
    list_display = (
        'asset_code',
        'asset_name',
        'category',
        'brand',
        'model',
        'status',
        'purchase_date',
        'warranty_expiry',
    )
    
    list_display_links = ('asset_code', 'asset_name')
    
    search_fields = (
        'asset_code',
        'asset_name',
        'brand',
        'model',
        'category__name',
    )
    
    list_filter = (
        'status',
        'category',
        'brand',
        'purchase_date',
    )
    
    ordering = ('asset_code',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('asset_name', 'asset_code', 'category')
        }),
        ('Specifications', {
            'fields': ('brand', 'model')
        }),
        ('Dates', {
            'fields': ('purchase_date', 'warranty_expiry')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AssetAssignment)
class AssetAssignmentAdmin(admin.ModelAdmin):
    """
    Admin configuration for AssetAssignment model.
    """
    
    list_display = (
        'asset',
        'employee',
        'assigned_date',
        'return_date',
        'status',
    )
    
    list_display_links = ('asset', 'employee')
    
    search_fields = (
        'asset__asset_code',
        'asset__asset_name',
        'employee__username',
        'employee__first_name',
        'employee__last_name',
        'employee__email',
    )
    
    list_filter = (
        'status',
        'assigned_date',
        'return_date',
    )
    
    ordering = ('-assigned_date',)
    
    fieldsets = (
        ('Assignment Information', {
            'fields': ('asset', 'employee', 'status')
        }),
        ('Dates', {
            'fields': ('assigned_date', 'return_date')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)