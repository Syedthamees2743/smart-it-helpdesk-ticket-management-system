"""
Notification Service - Sends actual emails via Django SMTP
"""

from django.core.mail import send_mail
from django.conf import settings


def send_email_notification(subject, message, recipient_list):
    """
    Reusable function to send emails.
    recipient_list must be a list of emails, e.g., ['user@example.com']
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False, # Set to True in production to prevent crashes
        )
        print(f"[EMAIL SENT] To: {recipient_list} | Subject: {subject}")
    except Exception as e:
        # In production, log this error properly. For now, print to terminal.
        print(f"[EMAIL FAILED] Error: {str(e)}")


def send_ticket_assigned_notification(ticket):
    if ticket.assigned_technician and ticket.assigned_technician.email:
        subject = f"[IT Desk] New Ticket Assigned: {ticket.ticket_number}"
        message = f"Hi {ticket.assigned_technician.get_full_name()},\n\nA new ticket has been assigned to you.\n\nTicket: {ticket.ticket_number}\nTitle: {ticket.title}\nPriority: {ticket.priority.upper()}\n\nPlease log in to view details."
        send_email_notification(subject, message, [ticket.assigned_technician.email])


def send_status_update_notification(ticket, old_status, new_status):
    if ticket.employee and ticket.employee.email:
        subject = f"[IT Desk] Update on Ticket {ticket.ticket_number}"
        message = f"Hi {ticket.employee.get_full_name()},\n\nYour ticket status has been updated.\n\nTicket: {ticket.ticket_number}\nChanged from: {old_status.upper()} -> {new_status.upper()}\n\nThank you."
        send_email_notification(subject, message, [ticket.employee.email])


def send_ticket_resolved_notification(ticket):
    if ticket.employee and ticket.employee.email:
        subject = f"[IT Desk] Ticket Resolved: {ticket.ticket_number}"
        message = f"Hi {ticket.employee.get_full_name()},\n\nYour ticket has been resolved by {ticket.assigned_technician.get_full_name()}.\n\nPlease log in to review and close the ticket, or reopen it if the issue persists."
        send_email_notification(subject, message, [ticket.employee.email])


def send_ticket_reopened_notification(ticket):
    if ticket.assigned_technician and ticket.assigned_technician.email:
        subject = f"[IT Desk] Ticket Reopened: {ticket.ticket_number}"
        message = f"Hi {ticket.assigned_technician.get_full_name()},\n\nTicket {ticket.ticket_number} has been reopened by the employee.\nReason: {ticket.reopen_reason}\n\nPlease take action."
        send_email_notification(subject, message, [ticket.assigned_technician.email])


def send_ticket_closed_notification(ticket):
    subject = f"[IT Desk] Ticket Closed: {ticket.ticket_number}"
    message = f"Ticket {ticket.ticket_number} has been successfully closed."
    # Send to both employee and technician
    emails = []
    if ticket.employee and ticket.employee.email: emails.append(ticket.employee.email)
    if ticket.assigned_technician and ticket.assigned_technician.email: emails.append(ticket.assigned_technician.email)
    if emails:
        send_email_notification(subject, message, emails)


def send_asset_assigned_notification(assignment):
    if assignment.employee and assignment.employee.email:
        subject = f"[IT Desk] Asset Assigned to You: {assignment.asset.asset_code}"
        message = f"Hi {assignment.employee.get_full_name()},\n\nAn asset has been assigned to you:\n\nAsset: {assignment.asset.asset_name} ({assignment.asset.asset_code})\nDate: {assignment.assigned_date}\n\nPlease take care of it."
        send_email_notification(subject, message, [assignment.employee.email])


def send_asset_returned_notification(assignment):
    if assignment.employee and assignment.employee.email:
        subject = f"[IT Desk] Asset Return Confirmed: {assignment.asset.asset_code}"
        message = f"Hi {assignment.employee.get_full_name()},\n\nThe return of asset {assignment.asset.asset_name} ({assignment.asset.asset_code}) has been recorded in the system."
        send_email_notification(subject, message, [assignment.employee.email])