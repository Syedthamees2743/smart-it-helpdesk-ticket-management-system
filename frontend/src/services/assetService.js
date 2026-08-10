import api from './api';

const assetService = {
  getAssets: (params) => api.get('/assets/', { params }),
  getAssetById: (id) => api.get(`/assets/${id}/`),
  createAsset: (data) => api.post('/assets/', data),
  updateAsset: (id, data) => api.patch(`/assets/${id}/`, data),
  deleteAsset: (id) => api.delete(`/assets/${id}/`),
  
  // Asset Management Actions
  assignAsset: (data) => api.post('/assets/manage/assign/', data),
  returnAsset: (data) => api.post('/assets/manage/return/', data),
  getMyAssets: () => api.get('/assets/manage/'), // Backend filters by logged-in employee
};

export default assetService;