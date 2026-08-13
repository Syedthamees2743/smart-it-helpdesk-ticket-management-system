import api from './api';

const API_URL = '/auth/users/';

// Get users — now supports query params for backend filtering
export const getUsers = (params = {}) => {
  // If a full URL is passed (for pagination), use it directly
  if (typeof params === 'string') {
    return api.get(params);
  }
  return api.get(API_URL, { params });
};

// Create new user
export const createUser = (userData) => api.post(API_URL, userData);

// Get single user details
export const getUserById = (id) => api.get(`${API_URL}${id}/`);

// Update user
export const updateUser = (id, userData) => api.patch(`${API_URL}${id}/`, userData);

// Delete user
export const deleteUser = (id) => api.delete(`${API_URL}${id}/`);

// Toggle active/inactive status
export const toggleUserStatus = (id) => api.patch(`${API_URL}${id}/toggle-status/`);