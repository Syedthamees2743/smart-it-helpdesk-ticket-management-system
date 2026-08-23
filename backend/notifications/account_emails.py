"""
Email functions for account activation workflow.
Smart IT Service Desk
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings


def send_registration_received_email(user):
    """
    Send confirmation email when registration is received.
    """
    subject = 'Registration Received - Smart IT Service Desk'
    
    if user.role == 'employee':
        try:
            profile = user.employee_profile
            user_id = profile.employee_id or 'N/A'
            department = profile.department.name if profile.department else 'N/A'
            extra_info = f"Designation: {profile.designation or 'N/A'}"
        except Exception:
            user_id = 'N/A'
            department = 'N/A'
            extra_info = ''
    else:
        try:
            profile = user.technician_profile
            user_id = profile.technician_id or 'N/A'
            department = profile.department.name if profile.department else 'N/A'
            extra_info = f"Specialization: {profile.specialization or 'N/A'}"
        except Exception:
            user_id = 'N/A'
            department = 'N/A'
            extra_info = ''

    context = {
        'user': user,
        'role': user.get_role_display(),
        'user_id': user_id,
        'department': department,
        'extra_info': extra_info,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    try:
        html_message = render_to_string('emails/registration_received.html', context)
        plain_message = render_to_string('emails/registration_received.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Changed to True - don't crash on email error
        )
        return True
    except Exception as e:
        print(f"Error sending registration email: {e}")
        return False


def send_approval_email(user, token):
    """
    Send approval email with activation link.
    """
    subject = 'Your Smart IT Service Desk Account Has Been Approved'
    
    if user.role == 'employee':
        try:
            profile = user.employee_profile
            user_id = profile.employee_id or 'N/A'
            department = profile.department.name if profile.department else 'N/A'
            extra_info = f"Designation: {profile.designation or 'N/A'}"
        except Exception:
            user_id = 'N/A'
            department = 'N/A'
            extra_info = ''
    else:
        try:
            profile = user.technician_profile
            user_id = profile.technician_id or 'N/A'
            department = profile.department.name if profile.department else 'N/A'
            extra_info = f"Specialization: {profile.specialization or 'N/A'}"
        except Exception:
            user_id = 'N/A'
            department = 'N/A'
            extra_info = ''

    activation_url = f"{settings.FRONTEND_URL}/activate-account/{token}"
    expires_hours = getattr(settings, 'ACTIVATION_TOKEN_EXPIRE_HOURS', 24)
    
    context = {
        'user': user,
        'role': user.get_role_display(),
        'user_id': user_id,
        'department': department,
        'extra_info': extra_info,
        'activation_url': activation_url,
        'expires_hours': expires_hours,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    try:
        html_message = render_to_string('emails/account_approved.html', context)
        plain_message = render_to_string('emails/account_approved.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Changed to True
        )
        return True
    except Exception as e:
        print(f"Error sending approval email: {e}")
        return False


def send_rejection_email(user, reason=''):
    """
    Send rejection email with optional reason.
    """
    subject = 'Your Smart IT Service Desk Account Request'
    
    context = {
        'user': user,
        'role': user.get_role_display(),
        'reason': reason or 'Not specified',
        'frontend_url': settings.FRONTEND_URL,
    }
    
    try:
        html_message = render_to_string('emails/account_rejected.html', context)
        plain_message = render_to_string('emails/account_rejected.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Changed to True
        )
        return True
    except Exception as e:
        print(f"Error sending rejection email: {e}")
        return False


def send_activation_success_email(user):
    """
    Send success email after account activation.
    """
    subject = 'Account Activated - Smart IT Service Desk'
    
    login_url = f"{settings.FRONTEND_URL}/login"
    
    context = {
        'user': user,
        'login_url': login_url,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    try:
        html_message = render_to_string('emails/activation_success.html', context)
        plain_message = render_to_string('emails/activation_success.txt', context)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Changed to True
        )
        return True
    except Exception as e:
        print(f"Error sending activation success email: {e}")
        return False