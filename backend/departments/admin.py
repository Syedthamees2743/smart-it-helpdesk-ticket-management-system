"""
Admin configuration for departments app
"""

from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """
    Admin configuration for Department model.
    """
    
    # Columns displayed in the list view
    list_display = (
        'name',
        'status',
        'created_at',
    )
    
    # Columns that link to the detail view
    list_display_links = ('name',)
    
    # Fields available for searching
    search_fields = (
        'name',
        'description',
    )
    
    # Filters on the right sidebar
    list_filter = (
        'status',
    )
    
    # Default ordering
    ordering = ('name',)
    
    # How fields are organized in the detail/edit view
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description')
        }),
        ('Status', {
            'fields': ('status',)
        }),
    )
    
    # Read-only fields
    readonly_fields = ('created_at',)