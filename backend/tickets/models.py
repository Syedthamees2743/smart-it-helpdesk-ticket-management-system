from django.db import models
from django.conf import settings
from .validators import validate_screenshot


PRIORITY_CHOICES = (
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('critical', 'Critical'),
)

STATUS_CHOICES = (
    ('open', 'Open'),
    ('assigned', 'Assigned'),
    ('in_progress', 'In Progress'),
    ('resolved', 'Resolved'),
    ('reopened', 'Reopened'),
    ('closed', 'Closed'),
)


class IssueCategory(models.Model):
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Category Name',
        help_text='Enter the issue category (e.g., Hardware, Software, Network)'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description',
        help_text='Brief description of this category'
    )
    
    class Meta:
        verbose_name = 'Issue Category'
        verbose_name_plural = 'Issue Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Ticket(models.Model):
    
    ticket_number = models.CharField(max_length=20, unique=True, editable=False, verbose_name='Ticket Number')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tickets', verbose_name='Employee')
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets', verbose_name='Department')
    category = models.ForeignKey(IssueCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets', verbose_name='Category')
    assigned_technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets', verbose_name='Assigned Technician')
    
    title = models.CharField(max_length=200, verbose_name='Title')
    description = models.TextField(verbose_name='Description')
    screenshot = models.ImageField(upload_to='ticket_screenshots/', blank=True, null=True, verbose_name='Screenshot', validators=[validate_screenshot])
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='Priority')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', verbose_name='Status')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    # --- WORKFLOW & SLA FIELDS ---
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments_made', verbose_name='Assigned By')
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name='Assigned At')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='Resolved At')
    sla_deadline = models.DateTimeField(null=True, blank=True, verbose_name='SLA Deadline')
    reopen_reason = models.TextField(blank=True, null=True, verbose_name='Reopen Reason')
    
    class Meta:
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket_number} - {self.title}"
    
    def save(self, *args, **kwargs):

        # 1. Generate Ticket Number
        if not self.ticket_number:
            last_ticket = Ticket.objects.order_by('-id').first()
            if last_ticket:
                last_number = int(last_ticket.ticket_number.split('-')[1])
                new_number = last_number + 1
            else:
                new_number = 1
            self.ticket_number = f'TKT-{new_number:06d}'

        # 2. Calculate SLA Deadline (OUTSIDE the ticket_number block!)
        if not self.sla_deadline and self.priority:
            from django.utils import timezone
            import datetime
            now = timezone.now()
            
            if self.priority == 'critical':
                self.sla_deadline = now + datetime.timedelta(hours=4)
            elif self.priority == 'high':
                self.sla_deadline = now + datetime.timedelta(hours=8)
            elif self.priority == 'medium':
                self.sla_deadline = now + datetime.timedelta(hours=24)
            elif self.priority == 'low':
                self.sla_deadline = now + datetime.timedelta(hours=48)
        
        super().save(*args, **kwargs)


class TicketComment(models.Model):
    
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Ticket',
        help_text='The ticket this comment belongs to'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_comments',
        verbose_name='User',
        help_text='The user who wrote this comment'
    )
    
    comment = models.TextField(
        verbose_name='Comment',
        help_text='Write your comment here'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'Ticket Comment'
        verbose_name_plural = 'Ticket Comments'
        ordering = ['created_at'] 
    
    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.ticket.ticket_number}"