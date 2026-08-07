"""
FAQ models for Smart IT Service Desk
"""

from django.db import models


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
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'
        ordering = ['question']
    
    def __str__(self):
        # Show first 100 characters of question for display
        return self.question[:100] + ('...' if len(self.question) > 100 else '')