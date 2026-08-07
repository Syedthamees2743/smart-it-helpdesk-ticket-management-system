"""
Department models for Smart IT Service Desk
"""

from django.db import models


# Status choices for department
STATUS_CHOICES = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
)


class Department(models.Model):
    """
    Represents a department in the organization.
    Examples: IT, HR, Finance, Marketing, Operations
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Department Name',
        help_text='Enter the department name (e.g., IT, HR, Finance)'
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description',
        help_text='Brief description of the department'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Status',
        help_text='Whether the department is active or inactive'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']  # Alphabetical order
    
    def __str__(self):
        return self.name