import api from './api';

const getFAQs = async (params = {}) => {
  const response = await api.get('/faqs/', { params: { page_size: 1000, ...params } });
  return response.data;
};

const getFAQ = async (id) => {
  const response = await api.get(`/faqs/${id}/`);
  return response.data;
};

const createFAQ = async (data) => {
  const response = await api.post('/faqs/', data);
  return response.data;
};

const updateFAQ = async (id, data) => {
  const response = await api.patch(`/faqs/${id}/`, data);
  return response.data;
};

const deleteFAQ = async (id) => {
  const response = await api.delete(`/faqs/${id}/`);
  return response.data;
};

const faqService = {
  getFAQs,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};

export default faqService;