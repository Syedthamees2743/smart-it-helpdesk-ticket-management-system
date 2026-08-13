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
  
  // Employee Views
  getMyAssets: () => api.get('/assets/assignments/'),
  getAssignmentById: (id) => api.get(`/assets/assignments/${id}/`),
  
  // Categories
  getAssetCategories: (params) => api.get('/assets/categories/', { params }),
};

export default assetService;