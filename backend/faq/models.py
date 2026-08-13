"""
FAQ models for Smart IT Service Desk
"""

from django.db import models
from django.conf import settings


# Category choices — used everywhere, defined once here
FAQ_CATEGORY_CHOICES = (
    ('Hardware', 'Hardware'),
    ('Software', 'Software'),
    ('Network', 'Network'),
    ('Account', 'Account'),
    ('Security', 'Security'),
    ('Printer', 'Printer'),
    ('General', 'General'),
)

# Status choices
FAQ_STATUS_CHOICES = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
)


class FAQ(models.Model):
    """
    Frequently Asked Questions for self-service help.
    """
    
    question = models.CharField(
        max_length=500,
        verbose_name='Question',
        help_text='The frequently asked question'
    )
    
    answer = models.TextField(
        verbose_name='Answer',
        help_text='The answer to the question'
    )
    
    category = models.CharField(
        max_length=50,
        choices=FAQ_CATEGORY_CHOICES,
        default='General',
        verbose_name='Category',
        help_text='Select the category for this FAQ'
    )
    
    status = models.CharField(
        max_length=20,
        choices=FAQ_STATUS_CHOICES,
        default='active',
        verbose_name='Status',
        help_text='Only active FAQs are visible to employees and technicians'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_faqs',
        verbose_name='Created By',
        help_text='Admin who created this FAQ'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At'
    )
    
    class Meta:
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'
        ordering = ['category', 'question']
    
    def __str__(self):
        return self.question[:100] + ('...' if len(self.question) > 100 else '')