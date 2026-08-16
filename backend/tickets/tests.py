from django.test import TestCase

from tickets.models import IssueCategory
from tickets.services.ai_complaint_service import parse_ai_response
from tickets.services.ai_troubleshooting_service import parse_ai_response as parse_troubleshooting_response


class AIComplaintParsingTests(TestCase):
    def test_parse_ai_response_with_reasoning_and_keyword_match(self):
        IssueCategory.objects.create(name='Hardware')
        IssueCategory.objects.create(name='Software')
        IssueCategory.objects.create(name='Network')

        reasoning = '''
        Okay, let's tackle this complaint. The user says their laptop isn't turning on.
        This is a hardware problem because the machine is not powering on and the battery light is blinking.
        The issue is urgent and could be critical because the user cannot work.
        '''

        result = parse_ai_response(reasoning)

        self.assertIsNotNone(result)
        self.assertEqual(result['suggested_category'], 'Hardware')
        self.assertEqual(result['suggested_priority'], 'critical')
        self.assertIn('hardware', result['reason'].lower())


class AITroubleshootingParsingTests(TestCase):
    def test_parse_troubleshooting_response_with_reasoning_text(self):
        reasoning = '''
        This looks like a network connectivity issue. The most likely causes are a bad Wi-Fi adapter,
        a failing switch port, or an IP configuration problem. Step 1: confirm the device can ping the gateway.
        Step 2: restart the affected device and reconnect to Wi-Fi. Step 3: check whether the port is up.
        The best fix is to reset the network connection and verify DHCP is working.
        '''

        result = parse_troubleshooting_response(reasoning)

        self.assertIsNotNone(result)
        self.assertIn('network', result['possible_issue'].lower())
        self.assertGreater(len(result['troubleshooting_steps']), 0)
        self.assertIn('network', result['suggested_resolution'].lower())
