"""
Reusable Professional Email Service for Smart IT Service Desk

Usage:
    from notifications.email_service import send_service_desk_email

    send_service_desk_email(
        recipient="user@example.com",
        subject="Ticket Status Updated - TKT-000003",
        title="Ticket Status Updated",
        message="Your support ticket status has been updated.",
        recipient_name="John",
        ticket_number="TKT-000003",
        status="In Progress",
        priority="High",
        action_url="https://yourdomain.com/admin/tickets/3",
        action_text="View Ticket",
    )
"""

import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def _build_plain_text(
    title,
    message,
    recipient_name,
    ticket_number,
    status,
    priority,
    action_url,
    action_text,
):
    """Generate a clean plain-text fallback."""
    lines = []
    name = recipient_name or "there"
    lines.append(f"Hello {name},")
    lines.append("")
    lines.append(message)
    lines.append("")

    if ticket_number or status or priority:
        lines.append("--- Ticket Details ---")
        if ticket_number:
            lines.append(f"Ticket Number: {ticket_number}")
        if status:
            lines.append(f"Status: {status}")
        if priority:
            lines.append(f"Priority: {priority}")
        lines.append("")

    if action_url:
        label = action_text or "View Ticket"
        lines.append(f"{label}: {action_url}")
        lines.append("")

    lines.append("Thank you,")
    lines.append("IT Service Desk Team")
    lines.append("")
    lines.append("---")
    lines.append("Smart IT Service Desk")
    lines.append("This is an automated notification. Please do not reply to this email.")

    return "\n".join(lines)


def send_service_desk_email(
    recipient,
    subject,
    title="Notification",
    message="",
    recipient_name="",
    ticket_number="",
    status="",
    priority="",
    action_url="",
    action_text="",
    cc=None,
    bcc=None,
    fail_silently=True,
):
    """
    Send a professional HTML email with plain-text fallback.

    Parameters
    ----------
    recipient : str or list
        Primary email address(es).
    subject : str
        Email subject line.
    title : str
        Bold heading shown inside the email body.
    message : str
        Main body message text.
    recipient_name : str, optional
        Used for greeting. Falls back to "there".
    ticket_number : str, optional
        Shown in ticket details card.
    status : str, optional
        Shown as a colored badge.
    priority : str, optional
        Shown as a colored badge.
    action_url : str, optional
        If provided, a CTA button is rendered.
    action_text : str, optional
        Label for the CTA button. Defaults to "View Ticket".
    cc : str or list, optional
        CC recipients.
    bcc : str or list, optional
        BCC recipients.
    fail_silently : bool
        If True, errors are silently ignored.

    Returns
    -------
    bool
        True if email was sent successfully.
    """

    # Normalize recipient to list
    if isinstance(recipient, str):
        recipient = [recipient]

    # Build HTML body from template
    html_body = render_to_string(
        "emails/base_email.html",
        {
            "title": title,
            "message": message,
            "recipient_name": recipient_name,
            "ticket_number": ticket_number,
            "status": status,
            "priority": priority,
            "action_url": action_url,
            "action_text": action_text,
        },
    )

    # Build plain-text fallback
    plain_body = _build_plain_text(
        title=title,
        message=message,
        recipient_name=recipient_name,
        ticket_number=ticket_number,
        status=status,
        priority=priority,
        action_url=action_url,
        action_text=action_text,
    )

    # Get from email from env or settings
    from_email = os.environ.get("EMAIL_FROM") or os.environ.get(
        "DEFAULT_FROM_EMAIL", "noreply@servicedesk.com"
    )

    # Create multipart email
    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_body,
        from_email=from_email,
        to=recipient,
        cc=cc,
        bcc=bcc,
    )
    email.attach_alternative(html_body, "text/html")

    # Send
    email.send(fail_silently=fail_silently)
    return True