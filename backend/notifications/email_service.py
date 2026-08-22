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
        employee_name="John Doe",
        employee_id="EMP-001",
        employee_department="IT",
        technician_name="Mike Smith",
        technician_id="TECH-001",
        technician_department="IT Support",
        updated_at="2025-01-15 14:30",
        action_url="https://yourdomain.com/admin/tickets/3",
        action_text="View Ticket",
    )
"""

import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def _format_enum(value):
    """Convert technical enum values like IN_PROGRESS to readable 'In Progress'."""
    if not value:
        return ""
    return value.replace("_", " ").strip().title()


def _build_plain_text(
    title,
    message,
    recipient_name,
    ticket_number,
    status,
    priority,
    employee_name,
    employee_id,
    employee_department,
    technician_name,
    technician_id,
    technician_department,
    updated_at,
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

    if employee_name or employee_id:
        lines.append("--- Employee ---")
        if employee_name:
            lines.append(f"Name: {employee_name}")
        if employee_id:
            dept = f" · {employee_department}" if employee_department else ""
            lines.append(f"{employee_id}{dept}")
        lines.append("")

    if technician_name or technician_id:
        lines.append("--- Technician ---")
        if technician_name:
            lines.append(f"Name: {technician_name}")
        if technician_id:
            dept = f" · {technician_department}" if technician_department else ""
            lines.append(f"{technician_id}{dept}")
        lines.append("")

    if updated_at:
        lines.append(f"Updated: {updated_at}")
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
    employee_name="",
    employee_id="",
    employee_department="",
    technician_name="",
    technician_id="",
    technician_department="",
    updated_at="",
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
        Shown as a colored badge. Enum values are auto-formatted.
    priority : str, optional
        Shown as a colored badge. Enum values are auto-formatted.
    employee_name : str, optional
        Employee full name.
    employee_id : str, optional
        Employee ID code (e.g. EMP-001).
    employee_department : str, optional
        Employee department name.
    technician_name : str, optional
        Assigned technician full name.
    technician_id : str, optional
        Technician ID code (e.g. TECH-001).
    technician_department : str, optional
        Technician department name.
    updated_at : str, optional
        Timestamp of the last update.
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

    # Format enum values for display
    display_status = _format_enum(status)
    display_priority = _format_enum(priority)

    # Build HTML body from template
    html_body = render_to_string(
        "emails/base_email.html",
        {
            "title": title,
            "message": message,
            "recipient_name": recipient_name,
            "ticket_number": ticket_number,
            "status": display_status,
            "priority": display_priority,
            "employee_name": employee_name,
            "employee_id": employee_id,
            "employee_department": employee_department,
            "technician_name": technician_name,
            "technician_id": technician_id,
            "technician_department": technician_department,
            "updated_at": updated_at,
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
        status=display_status,
        priority=display_priority,
        employee_name=employee_name,
        employee_id=employee_id,
        employee_department=employee_department,
        technician_name=technician_name,
        technician_id=technician_id,
        technician_department=technician_department,
        updated_at=updated_at,
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