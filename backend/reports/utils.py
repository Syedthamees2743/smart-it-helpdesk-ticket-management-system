"""
Reusable PDF Generation Utilities using ReportLab
"""

import io
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch


def generate_pdf_report(title, headers, data, filename="report.pdf"):
    """
    Generic function to generate a tabular PDF report.
    headers: List of strings (column names)
    data: List of lists (rows of data)
    """
    # Create a file-like buffer to receive PDF data.
    buffer = io.BytesIO()

    # Create the PDF object, using the buffer as its "file."
    doc = SimpleDocTemplate(buffer, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)

    # Container for 'Flowable' objects
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        textColor=colors.darkblue
    )

    # Add Title
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 12))

    # Prepare Table Data
    table_data = [headers] + data

    # Create Table
    table = Table(table_data, repeatRows=1)

    # Style the Table (Grid, Header background, alternating row colors)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    elements.append(table)

    # Build PDF
    doc.build(elements)

    # File response
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response