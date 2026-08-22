# models.py
from django.db import models


STATUS_CHOICES = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
)

DEPARTMENT_TYPE_CHOICES = (
    ('employee', 'Employee'),
    ('technician', 'Technician'),
    ('both', 'Both'),
)


class Department(models.Model):
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
    
    department_type = models.CharField(
        max_length=20,
        choices=DEPARTMENT_TYPE_CHOICES,
        default='both',
        verbose_name='Department Type',
        help_text='Which role can use this department'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='Status',
        help_text='Whether the department is active or inactive'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    
    class Meta:
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_department_type_display()})"