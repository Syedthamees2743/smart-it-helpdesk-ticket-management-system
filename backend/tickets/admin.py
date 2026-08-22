from django.contrib import admin
from .models import IssueCategory, Ticket, TicketComment


@admin.register(IssueCategory)
class IssueCategoryAdmin(admin.ModelAdmin):
    
    list_display = ('name', 'description')
    list_display_links = ('name',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
    )


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        'ticket_number',
        'title',
        'employee',
        'department',
        'category',
        'assigned_technician',
        'priority',
        'status',
        'created_at',
    )
    
    list_display_links = ('ticket_number', 'title')
    
    search_fields = (
        'ticket_number',
        'title',
        'description',
        'employee__username',
        'employee__first_name',
        'employee__last_name',
        'employee__email',
        'assigned_technician__username',
        'assigned_technician__first_name',
        'assigned_technician__last_name',
    )
    
    list_filter = (
        'priority',
        'status',
        'department',
        'category',
        'created_at',
    )
    
    ordering = ('-created_at',)
    
    # Make screenshot clickable in admin
    def screenshot_preview(self, obj):
        if obj.screenshot:
            return f'<a href="{obj.screenshot.url}" target="_blank"><img src="{obj.screenshot.url}" width="100" height="100" /></a>'
        return "No image"
    screenshot_preview.allow_tags = True
    screenshot_preview.short_description = 'Screenshot'
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_number', 'title', 'description', 'screenshot')
        }),
        ('Assignment', {
            'fields': ('employee', 'department', 'category', 'assigned_technician')
        }),
        ('Status', {
            'fields': ('priority', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('ticket_number', 'created_at', 'updated_at')


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    
    list_display = (
        'ticket',
        'user',
        'comment_preview',
        'created_at',
    )
    
    list_display_links = ('ticket',)
    
    search_fields = (
        'comment',
        'user__username',
        'user__first_name',
        'user__last_name',
        'ticket__ticket_number',
        'ticket__title',
    )
    
    list_filter = (
        'created_at',
        'ticket__status',
    )
    
    ordering = ('-created_at',)
    
    def comment_preview(self, obj):
        return obj.comment[:100] + ('...' if len(obj.comment) > 100 else '')
    comment_preview.short_description = 'Comment'
    
    fieldsets = (
        ('Comment Information', {
            'fields': ('ticket', 'user', 'comment')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)