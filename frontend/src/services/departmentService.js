import api from './api';

const API_URL = '/departments/';

// Get departments. 'params' allows us to pass ?search=IT&status=active
export const getDepartments = (params = {}) => api.get(API_URL, { params });

export const createDepartment = (data) => api.post(API_URL, data);

export const updateDepartment = (id, data) => api.patch(`${API_URL}${id}/`, data);

export const deleteDepartment = (id) => api.delete(`${API_URL}${id}/`);