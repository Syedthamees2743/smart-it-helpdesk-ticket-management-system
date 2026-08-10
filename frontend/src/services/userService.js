import api from './api'; // Our pre-configured Axios instance

const API_URL = '/auth/users/';

// Get users (handles pagination URLs automatically)
export const getUsers = (url = API_URL) => api.get(url);

// Create new user (Uses RegisterSerializer which needs password)
export const createUser = (userData) => api.post(API_URL, userData);

// Get single user details
export const getUserById = (id) => api.get(`${API_URL}${id}/`);

// Update user (Uses UserSerializer, NO password needed)
export const updateUser = (id, userData) => api.patch(`${API_URL}${id}/`, userData);

// Delete user
export const deleteUser = (id) => api.delete(`${API_URL}${id}/`);

// Toggle active/inactive status
export const toggleUserStatus = (id) => api.patch(`${API_URL}${id}/toggle-status/`);