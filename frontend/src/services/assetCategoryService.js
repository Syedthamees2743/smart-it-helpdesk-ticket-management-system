import api from './api';

const assetCategoryService = {
  getCategories: (params) => api.get('/assets/categories/', { params }),
  createCategory: (data) => api.post('/assets/categories/', data),
  updateCategory: (id, data) => api.patch(`/assets/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/assets/categories/${id}/`),
};

export default assetCategoryService;