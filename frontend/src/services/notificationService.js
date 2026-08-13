import api from './api';

const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications/', { params });
  return response.data;
};

const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count/');
  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.post(`/notifications/${id}/mark-read/`);
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.post('/notifications/mark-all-read/');
  return response.data;
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;