from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """
    Admin configuration for Feedback model.
    """
    
    list_display = (
        'ticket',
        'employee',
        'rating',
        'review_preview',
        'created_at',
    )
    
    list_display_links = ('ticket',)
    
    search_fields = (
        'ticket__ticket_number',
        'ticket__title',
        'employee__username',
        'employee__first_name',
        'employee__last_name',
        'review',
    )
    
    list_filter = (
        'rating',
        'created_at',
    )
    
    ordering = ('-created_at',)
    
    # Show preview of review
    def review_preview(self, obj):
        if obj.review:
            return obj.review[:100] + ('...' if len(obj.review) > 100 else '')
        return "No review"
    review_preview.short_description = 'Review'
    
    # Display rating as stars
    def rating_stars(self, obj):
        return '★' * obj.rating + '☆' * (5 - obj.rating)
    rating_stars.short_description = 'Rating'
    
    fieldsets = (
        ('Feedback Details', {
            'fields': ('ticket', 'employee', 'rating')
        }),
        ('Review', {
            'fields': ('review',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)