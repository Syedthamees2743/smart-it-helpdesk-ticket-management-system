"""
Reusable PDF Generation Utilities using ReportLab
Enhanced with page numbers, landscape support, timestamps,
alternating row colors, and summary sections.
"""

import io
from django.utils import timezone
from django.http import HttpResponse
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4, landscape as landscape_page


# ── Colour palette ──────────────────────────────────────────────
HEADER_BG = colors.HexColor("#1e3a5f")
HEADER_FG = colors.whitesmoke
ROW_EVEN = colors.HexColor("#f0f4f8")
ROW_ODD = colors.white
ACCENT = colors.HexColor("#2563eb")
FOOTER_LINE = colors.HexColor("#cbd5e1")
FOOTER_TEXT = colors.HexColor("#64748b")


def _draw_page_decorations(canvas, doc):
    """
    Called on every page — draws header accent line, footer with
    organisation name, generated timestamp, and page number.
    """
    canvas.saveState()
    width, height = A4  # always reference A4 even in landscape

    # ── Top accent line ──
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2)
    canvas.line(doc.leftMargin, height - doc.topMargin + 8,
                width - doc.rightMargin, height - doc.topMargin + 8)

    # ── Bottom footer line ──
    canvas.setStrokeColor(FOOTER_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, doc.bottomMargin - 10,
                doc.width + doc.leftMargin, doc.bottomMargin - 10)

    # ── Footer text ──
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(FOOTER_TEXT)

    # Left: organisation name
    canvas.drawString(doc.leftMargin, doc.bottomMargin - 22,
                      "Smart IT Service Desk")

    # Centre: page number
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(doc.width / 2 + doc.leftMargin,
                             doc.bottomMargin - 22,
                             f"Page {page_num}")

    # Right: generated timestamp
    gen = timezone.now().strftime("%Y-%m-%d %H:%M")
    canvas.drawRightString(doc.width + doc.leftMargin,
                           doc.bottomMargin - 22,
                           f"Generated: {gen}")

    canvas.restoreState()


def _build_table_style(num_rows):
    """
    Return a TableStyle with header, alternating rows, grid,
    and alignment — computed dynamically from row count.
    """
    cmds = [
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), HEADER_FG),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 10),

        # All cells
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),

        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, ACCENT),
    ]

    # Alternating row colours
    for i in range(1, num_rows):
        bg = ROW_EVEN if i % 2 == 0 else ROW_ODD
        cmds.append(("BACKGROUND", (0, i), (-1, i), bg))

    return TableStyle(cmds)


def generate_pdf_report(
    title,
    headers,
    data,
    filename="report.pdf",
    landscape=False,
    subtitle="",
    summary=None,
):
    """
    Generate a professional tabular PDF report.

    Parameters
    ----------
    title : str           – Report title shown at top
    headers : list[str]   – Column headings
    data : list[list]     – Row data (each row is a list of strings)
    filename : str        – Download filename
    landscape : bool      – Use landscape orientation for wide tables
    subtitle : str        – Optional subtitle (e.g. filtered date range)
    summary : list[str]   – Optional summary lines rendered before the table
                            (e.g. "Average Rating: 4.2 / 5")
    """
    buffer = io.BytesIO()

    page_size = landscape_page(A4) if landscape else A4
    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        leftMargin=30,
        rightMargin=30,
        topMargin=40,
        bottomMargin=30,
    )

    elements = []
    styles = getSampleStyleSheet()

    # ── Title ──
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        spaceAfter=4,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
    )
    elements.append(Paragraph(title, title_style))

    # ── Subtitle (filter info) ──
    if subtitle:
        sub_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=14,
            fontName="Helvetica",
        )
        elements.append(Paragraph(subtitle, sub_style))
    else:
        elements.append(Spacer(1, 10))

    # ── Summary section (before table) ──
    if summary:
        sum_style = ParagraphStyle(
            "ReportSummary",
            parent=styles["Normal"],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#1e3a5f"),
            fontName="Helvetica-Bold",
            spaceAfter=10,
        )
        for line in summary:
            elements.append(Paragraph(line, sum_style))
        elements.append(Spacer(1, 6))

    # ── Table ──
    table_data = [headers] + data
    table = Table(table_data, repeatRows=1)
    table.setStyle(_build_table_style(len(table_data)))
    elements.append(table)

    # ── No-data notice ──
    if not data:
        empty_style = ParagraphStyle(
            "EmptyNotice",
            parent=styles["Normal"],
            fontSize=11,
            textColor=colors.HexColor("#94a3b8"),
            alignment=1,  # centre
            spaceBefore=20,
            fontName="Helvetica-Oblique",
        )
        elements.append(Paragraph("No records found matching the criteria.", empty_style))

    # ── Build with page decorations ──
    doc.build(elements, onFirstPage=_draw_page_decorations,
              onLaterPages=_draw_page_decorations)

    # ── HTTP response ──
    buffer.seek(0)
    response = HttpResponse(buffer, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response