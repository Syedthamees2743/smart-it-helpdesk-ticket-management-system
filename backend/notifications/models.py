"""
Notification models for Smart IT Service Desk
"""

from django.db import models
from django.conf import settings


NOTIFICATION_TYPE_CHOICES = (
    ('ticket_created', 'Ticket Created'),
    ('ticket_assigned', 'Ticket Assigned'),
    ('ticket_status', 'Ticket Status Updated'),
    ('ticket_comment', 'Ticket Comment'),
    ('ticket_reopened', 'Ticket Reopened'),
    ('ticket_resolved', 'Ticket Resolved'),
    ('ticket_closed', 'Ticket Closed'),
    ('feedback_received', 'Feedback Received'),
    ('asset_assigned', 'Asset Assigned'),
    ('asset_returned', 'Asset Returned'),
    ('general', 'General'),
)


class Notification(models.Model):
    """
    In-app notification for a user.
    Each notification is tied to one user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='User',
        help_text='The user who receives this notification'
    )

    title = models.CharField(
        max_length=200,
        verbose_name='Title',
        help_text='Short title of the notification'
    )

    message = models.TextField(
        verbose_name='Message',
        help_text='Detailed message'
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='general',
        verbose_name='Type',
        help_text='Category of this notification'
    )

    ticket = models.ForeignKey(
        'tickets.Ticket',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Related Ticket',
        help_text='Optional related ticket'
    )

    is_read = models.BooleanField(
        default=False,
        verbose_name='Is Read',
        help_text='Whether the user has read this notification'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.get_full_name()}: {self.title}"