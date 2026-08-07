from django.contrib import admin
from .models import FAQ


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    """
    Admin configuration for FAQ model.
    """
    
    list_display = (
        'question_preview',
        'created_at',
    )
    
    list_display_links = ('question_preview',)
    
    search_fields = (
        'question',
        'answer',
    )
    
    ordering = ('question',)
    
    # Show preview of question (first 100 characters)
    def question_preview(self, obj):
        return obj.question[:100] + ('...' if len(obj.question) > 100 else '')
    question_preview.short_description = 'Question'
    
    fieldsets = (
        ('FAQ Details', {
            'fields': ('question', 'answer')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ('created_at',)