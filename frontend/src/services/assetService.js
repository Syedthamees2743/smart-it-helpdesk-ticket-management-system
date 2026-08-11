import api from './api';

const assetService = {
  getAssets: (params) => api.get('/assets/', { params }),
  getAssetById: (id) => api.get(`/assets/${id}/`),
  createAsset: (data) => api.post('/assets/', data),
  updateAsset: (id, data) => api.patch(`/assets/${id}/`, data),
  deleteAsset: (id) => api.delete(`/assets/${id}/`),
  
  // Admin Actions
  assignAsset: (data) => api.post('/assets/manage/assign/', data),
  returnAsset: (data) => api.post('/assets/manage/return/', data),
  
  // FIX: Changed to '/assets/assignments/' to hit the correct Employee ViewSet!
  getMyAssets: () => api.get('/assets/assignments/'), 
  
  // Categories
  getAssetCategories: (params) => api.get('/assets/categories/', { params }),
};

export default assetService;