import api from './api';

// Get Technician specific dashboard stats
export const getTechnicianDashboard = () => api.get('/dashboard/technician/');