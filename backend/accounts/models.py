from django.contrib.auth.models import AbstractUser
from django.db import models


# Role choices for users
ROLE_CHOICES = (
    ('admin', 'Admin'),
    ('employee', 'Employee'),
    ('technician', 'Technician'),
)


class User(AbstractUser):
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='employee',
        verbose_name='User Role',
        help_text='Select the role of this user'
    )
    
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        verbose_name='Phone Number',
        help_text='Enter phone number with country code'
    )
    
    profile_image = models.ImageField(
        upload_to='profile_images/',
        blank=True,
        null=True,
        verbose_name='Profile Image',
        help_text='Upload a profile picture'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At',
        help_text='Timestamp when user was created'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At',
        help_text='Timestamp when user was last updated'
    )
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']  
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

class EmployeeProfile(models.Model):
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        verbose_name='User',
        help_text='The user account for this employee'
    )
    
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees',
        verbose_name='Department',
        help_text='Department this employee belongs to'
    )
    
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Employee ID',
        help_text='Official employee ID (e.g., EMP-001)'
    )
    
    designation = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Designation',
        help_text='Job title or designation (e.g., Software Engineer)'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
        ordering = ['employee_id']
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"


class TechnicianProfile(models.Model):
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='technician_profile',
        verbose_name='User',
        help_text='The user account for this technician'
    )
    
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='technicians',
        verbose_name='Department',
        help_text='Department this technician belongs to'
    )
    
    technician_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Technician ID',
        help_text='Official technician ID (e.g., TECH-001)'
    )
    
    specialization = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Specialization',
        help_text='Area of expertise (e.g., Hardware, Networking, Software)'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    
    class Meta:
        verbose_name = 'Technician Profile'
        verbose_name_plural = 'Technician Profiles'
        ordering = ['technician_id']
    
    def __str__(self):
        return f"{self.technician_id} - {self.user.get_full_name()}"