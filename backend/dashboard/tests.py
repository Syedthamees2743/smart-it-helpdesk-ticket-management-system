from django.test import TestCase

from dashboard.services.ai_insights_service import parse_ai_response


class AIInsightsParsingTests(TestCase):
    def test_parse_ai_response_with_reasoning_text(self):
        reasoning = '''
        The ticket queue is growing and there are multiple high-priority issues in progress.
        SLA deadlines are at risk for a subset of active tickets, especially in the hardware and network categories.
        The operations team should review escalation rules, technician workload, and backlog trends.
        '''

        result = parse_ai_response(reasoning)

        self.assertIsNotNone(result)
        self.assertIn('support', result['summary'].lower())
        self.assertGreater(len(result['insights']), 0)
        self.assertTrue(any('sla' in item['text'].lower() or 'priority' in item['text'].lower() for item in result['insights']))
