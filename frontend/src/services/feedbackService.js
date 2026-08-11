import api from './api';

// Submit feedback for a ticket (employee)
const createFeedback = async (data) => {
  const response = await api.post('/feedbacks/', data);
  return response.data;
};

// Get feedback list (backend auto-filters by role)
const getFeedbackList = async (params = {}) => {
  const response = await api.get('/feedbacks/', { params });
  return response.data;
};

// Get single feedback details
const getFeedbackDetails = async (id) => {
  const response = await api.get(`/feedbacks/${id}/`);
  return response.data;
};

const feedbackService = {
  createFeedback,
  getFeedbackList,
  getFeedbackDetails,
};

export default feedbackService;