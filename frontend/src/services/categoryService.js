import api from './api';

// Note: Categories are nested under /tickets/ in your Django URLs
const API_URL = '/tickets/categories/';

export const getCategories = (params = {}) => api.get(API_URL, { params });

export const createCategory = (data) => api.post(API_URL, data);

export const updateCategory = (id, data) => api.patch(`${API_URL}${id}/`, data);

export const deleteCategory = (id) => api.delete(`${API_URL}${id}/`);