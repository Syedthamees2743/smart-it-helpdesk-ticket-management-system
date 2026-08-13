import api from './api';

const getTechnicianPerformance = async () => {
  const response = await api.get('/dashboard/technician-performance/');
  return response.data;
};

const getMyPerformance = async () => {
  const response = await api.get('/dashboard/my-performance/');
  return response.data;
};

const dashboardService = {
  getTechnicianPerformance,
  getMyPerformance,
};

export default dashboardService;