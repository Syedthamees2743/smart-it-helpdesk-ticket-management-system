import api from './api';

const getSettings = async () => {
  const response = await api.get('/notifications/settings/');
  return response.data;
};

const updateSettings = async (data) => {
  const response = await api.patch('/notifications/settings/', data);
  return response.data;
};

const getAdminUserPreferences = async (userId) => {
  const response = await api.get(`/notifications/admin/preferences/${userId}/`);
  return response.data;
};

const updateAdminUserPreferences = async (userId, data) => {
  const response = await api.patch(`/notifications/admin/preferences/${userId}/`, data);
  return response.data;
};

const settingsService = {
  getSettings,
  updateSettings,
  getAdminUserPreferences,
  updateAdminUserPreferences,
};

export default settingsService;