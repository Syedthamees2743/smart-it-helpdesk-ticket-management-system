"""
Feedback models for Smart IT Service Desk
"""

from django.db import models
from django.conf import settings


# Rating choices (1-5 stars)
RATING_CHOICES = (
    (1, '1 - Very Poor'),
    (2, '2 - Poor'),
    (3, '3 - Average'),
    (4, '4 - Good'),
    (5, '5 - Excellent'),
)


class Feedback(models.Model):
    """
    Feedback given by employees after ticket resolution.
    """
    
    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name='Ticket',
        help_text='The ticket this feedback is for'
    )
    
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_feedbacks',
        verbose_name='Employee',
        help_text='The employee giving this feedback'
    )
    
    rating = models.IntegerField(
        choices=RATING_CHOICES,
        default=3,
        verbose_name='Rating',
        help_text='Rate the service from 1 (Very Poor) to 5 (Excellent)'
    )
    
    review = models.TextField(
        blank=True,
        null=True,
        verbose_name='Review',
        help_text='Write your detailed review (optional)'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'
        # Ensure one feedback per ticket per employee
        unique_together = ('ticket', 'employee')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Feedback for {self.ticket.ticket_number} - Rating: {self.rating}/5"