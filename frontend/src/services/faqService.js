import api from './api';

const normalizeFAQ = (item = {}) => {
  const answer = item.answer ?? item.content ?? item.details ?? item.description ?? item.response ?? item.body ?? '';
  const question = item.question ?? item.title ?? item.heading ?? 'Untitled FAQ';

  return {
    ...item,
    id: item.id ?? item._id ?? item.slug ?? Math.random().toString(36).slice(2),
    question,
    answer,
    category: item.category ?? item.type ?? 'General',
    status: item.status ?? 'active',
  };
};

const normalizeFAQResponse = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.map(normalizeFAQ);
  }

  if (Array.isArray(data.results)) {
    return {
      ...data,
      results: data.results.map(normalizeFAQ),
    };
  }

  if (data.id || data.question || data.answer || data.content || data.details) {
    return normalizeFAQ(data);
  }

  return data;
};

const getFAQs = async (params = {}) => {
  const response = await api.get('/faqs/', { params: { page_size: 1000, ...params } });
  return normalizeFAQResponse(response.data);
};

const getFAQ = async (id) => {
  const response = await api.get(`/faqs/${id}/`);
  return normalizeFAQResponse(response.data);
};

const createFAQ = async (data) => {
  const response = await api.post('/faqs/', data);
  return normalizeFAQResponse(response.data);
};

const updateFAQ = async (id, data) => {
  const response = await api.patch(`/faqs/${id}/`, data);
  return normalizeFAQResponse(response.data);
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