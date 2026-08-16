import api from './api';

const analyzeComplaint = async (data) => {
  const response = await api.post('/tickets/ai/analyze-complaint/', data);
  return response.data;
};

const troubleshootTicket = async (data) => {
  const response = await api.post('/tickets/ai/troubleshoot/', data);
  return response.data;
};

const getSupportInsights = async () => {
  const response = await api.post('/dashboard/ai/support-insights/');
  return response.data;
};

const aiService = {
  analyzeComplaint,
  troubleshootTicket,
  getSupportInsights,
};

export default aiService;