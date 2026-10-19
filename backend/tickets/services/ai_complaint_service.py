"""
AI Complaint Analysis Service
Uses Hugging Face InferenceClient (OpenAI-compatible) to analyze complaints.
"""

import json
from django.conf import settings
from tickets.models import IssueCategory
from faq.models import FAQ


def get_valid_categories():
    """Get list of valid category names from database."""
    return list(IssueCategory.objects.values_list('name', flat=True))


def build_complaint_messages(title, description):
    """Build chat messages for the AI."""
    categories = get_valid_categories()
    categories_str = ", ".join(categories) if categories else "General"

    return [
        {
            "role": "system",
            "content": f"""You are an IT support assistant. Analyze complaints and suggest category and priority.

Valid categories (pick ONE exact name): {categories_str}
Valid priorities (pick ONE): low, medium, high, critical

Priority guide:
- low: minor inconvenience, workaround available
- medium: affects work but partial functionality remains
- high: significant impact, no workaround, urgent
- critical: system down, multiple users affected, business stoppage"""
        },
        {
            "role": "user",
            "content": f"""Analyze this IT complaint and respond with ONLY valid JSON, no other text.

Title: {title}
Description: {description}

Respond in this exact format:
{{"suggested_category": "exact category name", "suggested_priority": "low/medium/high/critical", "reason": "one sentence explanation"}}"""
        }
    ]


def parse_ai_response(content):
    """Parse AI response text and validate against database."""
    try:
        text = content.strip()

        # Qwen models add <think/> blocks — remove them completely
        while '<think' in text:
            think_start = text.find('<think')
            think_end = text.find('</think')
            if think_end == -1:
                text = text[:think_start].strip()
            else:
                text = (text[:think_start] + text[think_end + 8:]).strip()

        # Extract JSON from markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Find JSON object boundaries
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
            # Some models output reasoning text without a strict JSON payload.
            # Infer the best category and priority from the text content.
            valid_categories = get_valid_categories()
            lower_text = text.lower()
            category_name = None
            category_id = None

            for cat in valid_categories:
                cat_lower = cat.lower()
                if cat_lower in lower_text or lower_text in cat_lower:
                    category_name = cat
                    category_id = IssueCategory.objects.filter(name=cat).values_list('id', flat=True).first()
                    break

            if not category_name:
                keyword_map = {
                    'network': ['network', 'wifi', 'internet', 'connection', 'vpn', 'latency'],
                    'hardware': ['hardware', 'laptop', 'desktop', 'monitor', 'keyboard', 'battery', 'device', 'printer', 'mouse'],
                    'software': ['software', 'application', 'app', 'crash', 'error', 'login', 'bug', 'permission', 'system'],
                    'email': ['email', 'outlook', 'gmail', 'mail'],
                    'access request': ['access', 'permission', 'account', 'login', 'portal'],
                }

                for name, keywords in keyword_map.items():
                    if any(keyword in lower_text for keyword in keywords):
                        if name in [cat.lower() for cat in valid_categories]:
                            for cat in valid_categories:
                                if cat.lower() == name:
                                    category_name = cat
                                    category_id = IssueCategory.objects.filter(name=cat).values_list('id', flat=True).first()
                                    break
                        break

            if not category_name and valid_categories:
                category_name = valid_categories[0]
                category_id = IssueCategory.objects.filter(name=category_name).values_list('id', flat=True).first()

            priority = 'medium'
            if 'critical' in lower_text or 'urgent' in lower_text or 'system down' in lower_text:
                priority = 'critical'
            elif 'high' in lower_text or 'major' in lower_text or 'significant' in lower_text:
                priority = 'high'
            elif 'low' in lower_text or 'minor' in lower_text or 'small' in lower_text:
                priority = 'low'

            reason = text.strip()
            if len(reason) > 220:
                reason = reason[:220].rstrip() + '...'

            return {
                'suggested_category': category_name,
                'suggested_category_id': category_id,
                'suggested_priority': priority,
                'reason': reason or 'AI analysis completed.'
            }

        # --- Validate Category ---
        valid_categories = get_valid_categories()
        suggested_category_raw = str(data.get('suggested_category', '')).strip()
        category_id = None
        category_name = None

        # Exact match (case-insensitive)
        for cat in valid_categories:
            if cat.lower() == suggested_category_raw.lower():
                category_id = IssueCategory.objects.filter(name=cat).values_list('id', flat=True).first()
                category_name = cat
                break

        # Partial match fallback
        if not category_id and suggested_category_raw:
            for cat in valid_categories:
                if suggested_category_raw.lower() in cat.lower() or cat.lower() in suggested_category_raw.lower():
                    category_id = IssueCategory.objects.filter(name=cat).values_list('id', flat=True).first()
                    category_name = cat
                    break

        # --- Validate Priority ---
        valid_priorities = ['low', 'medium', 'high', 'critical']
        suggested_priority = str(data.get('suggested_priority', 'medium')).lower().strip()
        if suggested_priority not in valid_priorities:
            suggested_priority = 'medium'

        # --- Reason ---
        reason = str(data.get('reason', '')).strip()
        if not reason:
            reason = 'AI analysis completed.'

        return {
            'suggested_category': category_name,
            'suggested_category_id': category_id,
            'suggested_priority': suggested_priority,
            'reason': reason,
        }

    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        print(f"[AI PARSE ERROR] {type(e).__name__}: {e}")
        return None


def find_related_faqs(title, description):
    """Search active FAQs related to the complaint."""
    combined = f"{title} {description}".lower()
    keywords = [w for w in combined.split() if len(w) > 3]
    related = []

    faqs = FAQ.objects.filter(status='active')
    for faq in faqs:
        faq_text = f"{faq.question} {faq.answer}".lower()
        match_count = sum(1 for kw in keywords if kw in faq_text)
        if match_count >= 2:
            related.append({
                'id': faq.id,
                'question': faq.question,
                'category': faq.category,
            })

    related.sort(
        key=lambda x: sum(1 for kw in keywords if kw in x['question'].lower()),
        reverse=True
    )
    return related[:3]


def analyze_complaint(title, description):
    """
    Main entry point: Analyze complaint and suggest category/priority.
    """
    try:
        combined_text = f"{title} {description}".strip()
        
        # 1. Parse using existing fallback parser
        parsed = parse_ai_response(combined_text)

        # 2. Optional HF call without breaking client
        api_key = getattr(settings, 'HF_TOKEN', '')
        if api_key:
            try:
                import requests
                api_url = "https://router.huggingface.co/hf-inference/models/google/flan-t5-large"
                headers = {"Authorization": f"Bearer {api_key}"}
                prompt = f"Categorize IT issue: {title}. Description: {description}"
                resp = requests.post(api_url, headers=headers, json={"inputs": prompt}, timeout=5)
                if resp.status_code == 200:
                    print("[AI COMPLAINT SUCCESS] 200 OK")
            except Exception as hf_err:
                print(f"[AI COMPLAINT HF SKIP] {hf_err}")

        if not parsed:
            return {
                'success': False,
                'error': 'AI response was unclear. Please select category and priority manually.'
            }

        # Find related FAQs
        parsed['related_faqs'] = find_related_faqs(title, description)

        return {
            'success': True,
            'data': parsed
        }

    except Exception as e:
        print(f"[AI ERROR] {type(e).__name__}: {e}")
        return {
            'success': False,
            'error': 'AI assistance is currently unavailable. You can continue using the system normally.'
        }