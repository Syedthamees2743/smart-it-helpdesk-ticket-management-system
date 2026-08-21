from django.core.mail import send_mail
from django.conf import settings
from .email_service import send_service_desk_email


def send_email_notification(subject, message, recipient_list):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        print(f"[EMAIL SENT] To: {recipient_list} | Subject: {subject}")
    except Exception as e:
        print(f"[EMAIL FAILED] Error: {str(e)}")


def send_ticket_assigned_notification(ticket):
    if ticket.assigned_technician and ticket.assigned_technician.email:
        tech = ticket.assigned_technician
        send_service_desk_email(
            recipient=tech.email,
            subject=f"[IT Desk] New Ticket Assigned: {ticket.ticket_number}",
            title="New Ticket Assigned",
            message=f"A new support ticket has been assigned to you.\n\nTitle: {ticket.title}",
            recipient_name=tech.get_full_name(),
            ticket_number=ticket.ticket_number,
            status=ticket.get_status_display(),
            priority=ticket.get_priority_display(),
        )


def send_status_update_notification(ticket, old_status, new_status):
    if ticket.employee and ticket.employee.email:
        emp = ticket.employee
        send_service_desk_email(
            recipient=emp.email,
            subject=f"[IT Desk] Update on Ticket {ticket.ticket_number}",
            title="Ticket Status Updated",
            message=(
                f"Your support ticket status has been changed.\n\n"
                f"From: {old_status.replace('_', ' ').title()}\n"
                f"To: {new_status.replace('_', ' ').title()}"
            ),
            recipient_name=emp.get_full_name(),
            ticket_number=ticket.ticket_number,
            status=new_status.replace('_', ' ').title(),
            priority=ticket.get_priority_display(),
        )


def send_ticket_resolved_notification(ticket):
    if ticket.employee and ticket.employee.email:
        emp = ticket.employee
        tech_name = (
            ticket.assigned_technician.get_full_name()
            if ticket.assigned_technician
            else "a technician"
        )
        send_service_desk_email(
            recipient=emp.email,
            subject=f"[IT Desk] Ticket Resolved: {ticket.ticket_number}",
            title="Ticket Resolved",
            message=(
                f"Your ticket has been resolved by {tech_name}.\n\n"
                f"Please log in to review and close the ticket, "
                f"or reopen it if the issue persists."
            ),
            recipient_name=emp.get_full_name(),
            ticket_number=ticket.ticket_number,
            status="Resolved",
            priority=ticket.get_priority_display(),
        )


def send_ticket_reopened_notification(ticket):
    if ticket.assigned_technician and ticket.assigned_technician.email:
        tech = ticket.assigned_technician
        reason = ticket.reopen_reason or "No reason provided."
        send_service_desk_email(
            recipient=tech.email,
            subject=f"[IT Desk] Ticket Reopened: {ticket.ticket_number}",
            title="Ticket Reopened",
            message=(
                f"Ticket {ticket.ticket_number} has been reopened by the employee.\n\n"
                f"Reason: {reason}"
            ),
            recipient_name=tech.get_full_name(),
            ticket_number=ticket.ticket_number,
            status="Reopened",
            priority=ticket.get_priority_display(),
        )


def send_ticket_closed_notification(ticket):
    emails = []
    if ticket.employee and ticket.employee.email:
        emails.append(ticket.employee.email)
    if ticket.assigned_technician and ticket.assigned_technician.email:
        emails.append(ticket.assigned_technician.email)
    if emails:
        send_service_desk_email(
            recipient=emails,
            subject=f"[IT Desk] Ticket Closed: {ticket.ticket_number}",
            title="Ticket Closed",
            message="This ticket has been successfully closed.",
            ticket_number=ticket.ticket_number,
            status="Closed",
            priority=ticket.get_priority_display(),
        )


def send_asset_assigned_notification(assignment):
    if assignment.employee and assignment.employee.email:
        emp = assignment.employee
        send_service_desk_email(
            recipient=emp.email,
            subject=f"[IT Desk] Asset Assigned to You: {assignment.asset.asset_code}",
            title="Asset Assigned",
            message=(
                f"An IT asset has been assigned to you.\n\n"
                f"Asset: {assignment.asset.asset_name} ({assignment.asset.asset_code})\n"
                f"Assigned Date: {assignment.assigned_date}"
            ),
            recipient_name=emp.get_full_name(),
        )


def send_asset_returned_notification(assignment):
    if assignment.employee and assignment.employee.email:
        emp = assignment.employee
        send_service_desk_email(
            recipient=emp.email,
            subject=f"[IT Desk] Asset Return Confirmed: {assignment.asset.asset_code}",
            title="Asset Return Confirmed",
            message=(
                f"The return of asset {assignment.asset.asset_name} "
                f"({assignment.asset.asset_code}) has been recorded in the system."
            ),
            recipient_name=emp.get_full_name(),
        )


def create_notification(user, title, message, notification_type='general', ticket=None):
    from .models import Notification
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        ticket=ticket,
    )