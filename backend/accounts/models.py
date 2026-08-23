"""
Custom User Model for Smart IT Service Desk
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
import secrets
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


ROLE_CHOICES = (
    ('admin', 'Admin'),
    ('employee', 'Employee'),
    ('technician', 'Technician'),
)

ACCOUNT_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('active', 'Active'),
)


class User(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    """

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
        verbose_name='Created At'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At'
    )

    account_status = models.CharField(
        max_length=20,
        choices=ACCOUNT_STATUS_CHOICES,
        default='active',
        verbose_name='Account Status',
        help_text='Current status of the account'
    )

    rejection_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Rejection Reason',
        help_text='Reason for account rejection (if applicable)'
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"


class EmployeeProfile(models.Model):
    """Additional profile information for employees."""

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
        blank=True,
        null=True,
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
        return f"{self.employee_id or 'N/A'} - {self.user.get_full_name()}"


class TechnicianProfile(models.Model):
    """Additional profile information for technicians."""

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
        blank=True,
        null=True,
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
        return f"{self.technician_id or 'N/A'} - {self.user.get_full_name()}"


class AccountActivation(models.Model):
    """Stores activation tokens for approved accounts."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='activation',
        verbose_name='User',
    )

    token = models.CharField(
        max_length=64,
        unique=True,
        verbose_name='Activation Token',
        help_text='Secure activation token'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )

    expires_at = models.DateTimeField(
        verbose_name='Expires At',
        help_text='When this token expires'
    )

    used = models.BooleanField(
        default=False,
        verbose_name='Used',
        help_text='Whether this token has been used'
    )

    class Meta:
        verbose_name = 'Account Activation'
        verbose_name_plural = 'Account Activations'

    def save(self, *args, **kwargs):
        if not self.expires_at:
            hours = getattr(settings, 'ACTIVATION_TOKEN_EXPIRE_HOURS', 24)
            self.expires_at = timezone.now() + timedelta(hours=hours)
        super().save(*args, **kwargs)

    def is_valid(self):
        """Check if token is still valid. Returns (bool, error_message)."""
        if self.used:
            return False, "This activation link has already been used."
        if timezone.now() > self.expires_at:
            return False, "This activation link has expired."
        return True, None

    def __str__(self):
        return f"Activation for {self.user.get_full_name()}"