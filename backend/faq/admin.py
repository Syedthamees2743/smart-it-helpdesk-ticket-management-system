from django.contrib import admin
from .models import FAQ


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = (
        'question_preview',
        'category',
        'status',
        'created_by',
        'created_at',
        'updated_at',
    )
    
    list_display_links = ('question_preview',)
    
    list_filter = (
        'category',
        'status',
    )
    
    search_fields = (
        'question',
        'answer',
    )
    
    ordering = ('category', 'question')
    
    def question_preview(self, obj):
        return obj.question[:80] + ('...' if len(obj.question) > 80 else '')
    question_preview.short_description = 'Question'
    
    fieldsets = (
        ('FAQ Details', {
            'fields': ('question', 'answer', 'category', 'status')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')