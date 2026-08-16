import api from './api';

const getAdminAnalytics = async () => {
  const response = await api.get('/dashboard/admin-analytics/');
  return response.data;
};

const getEmployeeDashboard = async () => {
  const response = await api.get('/dashboard/employee/');
  return response.data;
};

const getTechnicianPerformance = async () => {
  const response = await api.get('/dashboard/technician-performance/');
  return response.data;
};

const getMyPerformance = async () => {
  const response = await api.get('/dashboard/my-performance/');
  return response.data;
};

const dashboardService = {
  getAdminAnalytics,
  getEmployeeDashboard,
  getTechnicianPerformance,
  getMyPerformance,
};

export default dashboardService;