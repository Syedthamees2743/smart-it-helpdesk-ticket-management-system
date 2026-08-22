import api from './api';

const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications/', { params });
  return response.data;
};

// ⭐ NEW - For pagination next/prev URL
const getNotificationsByUrl = async (url) => {
  const response = await api.get(url);
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
  getNotificationsByUrl,  // ⭐ NEW
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;