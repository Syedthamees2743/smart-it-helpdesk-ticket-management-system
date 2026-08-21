from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, EmployeeProfile, TechnicianProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'role',
        'is_active',
        'created_at',
    )
    
    list_display_links = ('username', 'email')
    
    search_fields = (
        'username',
        'email',
        'first_name',
        'last_name',
        'phone_number',
    )
    
    list_filter = (
        'role',
        'is_active',
        'is_staff',
    )
    
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Information', {
            'fields': (
                'role',
                'phone_number',
                'profile_image',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Information', {
            'fields': (
                'role',
                'phone_number',
                'profile_image',
            )
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    
    list_display = (
        'employee_id',
        'user',
        'department',
        'designation',
        'created_at',
    )
    
    list_display_links = ('employee_id', 'user')
    
    search_fields = (
        'employee_id',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'designation',
    )
    
    list_filter = (
        'department',
    )
    
    ordering = ('employee_id',)
    
    fieldsets = (
        ('Profile Information', {
            'fields': ('user', 'employee_id', 'designation')
        }),
        ('Department', {
            'fields': ('department',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)


@admin.register(TechnicianProfile)
class TechnicianProfileAdmin(admin.ModelAdmin):
    
    list_display = (
        'technician_id',
        'user',
        'department',
        'specialization',
        'created_at',
    )
    
    list_display_links = ('technician_id', 'user')
    
    search_fields = (
        'technician_id',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
        'specialization',
    )
    
    list_filter = (
        'department',
    )
    
    ordering = ('technician_id',)
    
    fieldsets = (
        ('Profile Information', {
            'fields': ('user', 'technician_id', 'specialization')
        }),
        ('Department', {
            'fields': ('department',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)