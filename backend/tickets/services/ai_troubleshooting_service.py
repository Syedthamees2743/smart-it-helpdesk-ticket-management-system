"""
AI Troubleshooting Service for Technicians.
Uses Hugging Face InferenceClient to analyze tickets and suggest troubleshooting steps.
"""

import json
from django.conf import settings
from tickets.models import Ticket


def build_troubleshoot_messages(ticket):
    """Build chat messages for the AI based on real ticket data."""
    category_name = ticket.category.name if ticket.category else "Unknown"
    priority = ticket.priority

    messages = [
        {
            "role": "system",
            "content": """You are an expert IT troubleshooting assistant. A technician needs help diagnosing and resolving a support ticket.

Provide structured troubleshooting guidance based on the ticket details.

You MUST respond with ONLY valid JSON in this exact format, no other text:
{"possible_issue": "short issue classification", "possible_causes": ["cause 1", "cause 2", "cause 3"], "troubleshooting_steps": ["step 1", "step 2", "step 3", "step 4"], "suggested_resolution": "one sentence resolution suggestion"}

Rules:
- possible_issue: 2-4 words classifying the problem
- possible_causes: 2-4 realistic technical causes
- troubleshooting_steps: 3-5 ordered steps a technician can follow
- suggested_resolution: one practical sentence suggesting the most likely fix
- Be specific and technical, not vague"""
        },
        {
            "role": "user",
            "content": f"""Analyze this IT support ticket and provide troubleshooting guidance:

Ticket: {ticket.ticket_number}
Title: {ticket.title}
Description: {ticket.description}
Category: {category_name}
Priority: {priority}

Respond with ONLY the JSON object."""
        }
    ]

    return messages


def parse_ai_response(content):
    """Parse and validate AI troubleshooting response."""
    try:
        text = content.strip()

        # Remove Qwen3 <think/> blocks
        while '<think' in text:
            think_start = text.find('<think')
            think_end = text.find('</think')
            if think_end == -1:
                text = text[:think_start].strip()
            else:
                text = (text[:think_start] + text[think_end + 8:]).strip()

        # Remove markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Extract JSON if present
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            candidate = text[start:end + 1]
            try:
                data = json.loads(candidate)
            except json.JSONDecodeError:
                data = None
        else:
            data = None

        if data is None:
            lower_text = text.lower()
            issue = 'Network Connectivity'
            if 'printer' in lower_text or 'print' in lower_text:
                issue = 'Printer Issue'
            elif 'email' in lower_text or 'outlook' in lower_text:
                issue = 'Email Issue'
            elif 'login' in lower_text or 'access' in lower_text:
                issue = 'Access Issue'
            elif 'hardware' in lower_text or 'laptop' in lower_text or 'monitor' in lower_text:
                issue = 'Hardware Issue'
            elif 'software' in lower_text or 'application' in lower_text or 'crash' in lower_text:
                issue = 'Software Issue'

            causes = []
            if 'wifi' in lower_text or 'network' in lower_text or 'connection' in lower_text:
                causes.extend(['Weak or unstable Wi-Fi signal', 'Faulty switch or access point port', 'Incorrect IP or DHCP configuration'])
            elif 'printer' in lower_text:
                causes.extend(['Printer offline or disconnected', 'Stale print queue', 'Driver or spooler issue'])
            elif 'email' in lower_text:
                causes.extend(['Authentication or credential issue', 'Mailbox sync problem', 'Email server outage'])
            else:
                causes.extend(['Misconfigured device settings', 'Service or dependency outage', 'Insufficient permissions or policy issue'])

            steps = []
            for match in [
                'Step 1: verify the device is connected and powered on.',
                'Step 2: restart the affected device or service and retry the action.',
                'Step 3: check the relevant configuration, logs, and connectivity status.',
                'Step 4: escalate to infrastructure or vendor support if the issue persists.',
            ]:
                steps.append(match)

            if 'ping' in lower_text:
                steps[0] = 'Step 1: confirm the device can ping the gateway or primary server.'
            if 'restart' in lower_text:
                steps[1] = 'Step 2: restart the affected device or service and reconnect.'
            if 'dhcp' in lower_text or 'ip' in lower_text:
                steps[2] = 'Step 3: validate the IP configuration, DHCP lease, and network adapter status.'

            resolution = 'Reset the affected connection or service, verify configuration, and confirm the issue is resolved before closing the ticket.'
            if 'wifi' in lower_text or 'network' in lower_text:
                resolution = 'Reconnect the device to the network, verify DHCP and connectivity, and fix the root network problem before closing the ticket.'
            elif 'printer' in lower_text:
                resolution = 'Clear the print queue, reconnect the printer, and reinstall or update the driver if needed.'
            elif 'email' in lower_text:
                resolution = 'Verify account credentials and mail connectivity, then resync or repair the email configuration.'

            return {
                'possible_issue': issue,
                'possible_causes': causes[:5],
                'troubleshooting_steps': steps[:6],
                'suggested_resolution': resolution,
            }

        # Validate required fields
        possible_issue = str(data.get('possible_issue', '')).strip()
        causes = data.get('possible_causes', [])
        steps = data.get('troubleshooting_steps', [])
        resolution = str(data.get('suggested_resolution', '')).strip()

        # Ensure lists
        if not isinstance(causes, list):
            causes = [str(causes)]
        if not isinstance(steps, list):
            steps = [str(steps)]

        # Clean up list items
        causes = [str(c).strip() for c in causes if str(c).strip()]
        steps = [str(s).strip() for s in steps if str(s).strip()]

        if not possible_issue or not steps:
            print(f"[AI TROUBLESHOOT PARSE ERROR] Missing required fields: issue={possible_issue}, steps={len(steps)}")
            return None

        return {
            'possible_issue': possible_issue,
            'possible_causes': causes[:5],
            'troubleshooting_steps': steps[:6],
            'suggested_resolution': resolution or 'Follow the troubleshooting steps to diagnose and resolve the issue.',
        }

    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        print(f"[AI TROUBLESHOOT PARSE ERROR] {type(e).__name__}: {e}")
        return None


def troubleshoot_ticket(ticket):
    """
    Main entry point: Analyze a ticket for troubleshooting guidance.
    """
    api_key = getattr(settings, 'HF_TOKEN', '')

    if not api_key:
        return {
            'success': False,
            'error': 'AI service is not configured. Please contact your administrator.'
        }

    try:
        from huggingface_hub import InferenceClient

        messages = build_troubleshoot_messages(ticket)
        model = getattr(settings, 'HUGGINGFACE_AI_MODEL', 'Qwen/Qwen3-8B:nscale')

        client = InferenceClient(api_key=api_key)

        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=400,
            temperature=0.3,
        )

        # Extract text — handle Qwen3's reasoning_content
        message = completion.choices[0].message
        ai_text = getattr(message, 'content', None) or ''
        reasoning = getattr(message, 'reasoning_content', None) or ''

        combined = ai_text.strip()
        if len(combined) < 10:
            combined = reasoning.strip()

        print(f"[AI TROUBLESHOOT RAW content] {repr(ai_text[:200])}")
        print(f"[AI TROUBLESHOOT RAW reasoning] {repr(reasoning[:200] if reasoning else 'None')}")

        if not combined or len(combined) < 10:
            return {
                'success': False,
                'error': 'AI could not analyze this ticket. Please troubleshoot manually.'
            }

        parsed = parse_ai_response(combined)

        if not parsed:
            return {
                'success': False,
                'error': 'AI response was unclear. Please troubleshoot manually.'
            }

        return {
            'success': True,
            'data': parsed
        }

    except Exception as e:
        print(f"[AI TROUBLESHOOT ERROR] {type(e).__name__}: {e}")
        error_msg = str(e)

        if 'loading' in error_msg.lower() or '503' in error_msg:
            friendly = 'AI model is loading. Please try again in 30 seconds.'
        elif '429' in error_msg or 'rate' in error_msg.lower():
            friendly = 'AI service is busy. Please wait a moment and try again.'
        elif 'timeout' in error_msg.lower():
            friendly = 'AI service timed out. Please try again or troubleshoot manually.'
        elif 'auth' in error_msg.lower() or 'token' in error_msg.lower() or '401' in error_msg:
            friendly = 'AI API key is invalid. Please contact your administrator.'
        elif 'connect' in error_msg.lower():
            friendly = 'Could not reach AI service. Check your internet connection.'
        else:
            friendly = 'AI assistance is currently unavailable. You can continue troubleshooting manually.'

        return {
            'success': False,
            'error': friendly
        }