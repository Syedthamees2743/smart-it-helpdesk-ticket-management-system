"""
New User Credential Email Service
==================================
Sends login credentials to newly created Employee/Technician users.

IMPORTANT SECURITY NOTES:
- raw_password exists ONLY in memory during the request lifecycle
- raw_password is NEVER stored in the database
- raw_password is NEVER stored in the Notification model
- raw_password is NEVER logged or printed
- After email is sent, raw_password is garbage collected from memory
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_new_user_credentials_email(user, raw_password, role):
    """
    Send welcome email with login credentials to a newly created user.

    This function should ONLY be called during the account creation request,
    when the raw password is still available in memory.

    Args:
        user: The User instance (just created, password already hashed in DB)
        raw_password: The plain password provided during creation
                      (temporary, in-memory only, NOT from DB)
        role: The user's role string (e.g., 'employee', 'technician')

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Prepare context for email template
        # Note: raw_password is used here and then goes out of scope
        context = {
            'full_name': user.get_full_name() or user.username,
            'username': user.username,
            'password': raw_password,
            'role': role.capitalize() if role else 'User',
            'login_url': getattr(settings, 'FRONTEND_LOGIN_URL', '/login'),
            'site_name': 'Smart IT Service Desk',
        }

        subject = f"[{context['site_name']}] Your Account Has Been Created"

        # Render HTML version from template
        html_content = render_to_string(
            'emails/new_user_credentials.html',
            context
        )

        # Plain-text fallback (no password in logs, only in email body)
        plain_text = _generate_plain_text_fallback(context)

        # Create and send email using Django's built-in email
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        return True

    except Exception as e:
        # CRITICAL: Do NOT log raw_password
        # CRITICAL: Do NOT log request.data
        # Only log non-sensitive failure information
        logger.error(
            "Failed to send credentials email to user '%s' (email: %s). "
            "Error: %s",
            user.username,
            user.email,
            str(e)
        )
        return False


def _generate_plain_text_fallback(context):
    """
    Generate plain-text version of the credential email.
    Used as fallback for email clients that don't render HTML.
    """
    return (
        f"Hello {context['full_name']},\n\n"
        f"Your {context['site_name']} account has been successfully "
        f"created by the administrator.\n\n"
        f"Account Details:\n"
        f"----------------\n"
        f"Name: {context['full_name']}\n"
        f"Username: {context['username']}\n"
        f"Password: {context['password']}\n"
        f"Role: {context['role']}\n\n"
        f"Login URL: {context['login_url']}\n\n"
        f"Please keep these credentials secure. "
        f"For security reasons, do not share your password with anyone.\n\n"
        f"This is an automated email from {context['site_name']}.\n\n"
        f"Regards,\n"
        f"IT Service Desk Team"
    )