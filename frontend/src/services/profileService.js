import api from './api';

const getOwnProfile = async () => {
  const response = await api.get('/auth/update-own-profile/');
  return response.data;
};

const updateOwnProfile = async (data) => {
  const response = await api.patch('/auth/update-own-profile/', data);
  return response.data;
};

const updateProfileImage = async (formData) => {
  const response = await api.put('/auth/update-profile-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const changePassword = async (data) => {
  const response = await api.post('/auth/change-password/', data);
  return response.data;
};

const getEmployeeProfile = async () => {
  const response = await api.get('/auth/profiles/employee/');
  return response.data;
};

const getTechnicianProfile = async () => {
  const response = await api.get('/auth/profiles/technician/');
  return response.data;
};

const getUserRoleProfile = async (userId) => {
  const response = await api.get(`/auth/users/${userId}/role-profile/`);
  return response.data;
};

const updateUserRoleProfile = async (userId, data) => {
  const response = await api.patch(`/auth/users/${userId}/role-profile/`, data);
  return response.data;
};

const profileService = {
  getOwnProfile,
  updateOwnProfile,
  updateProfileImage,
  changePassword,
  getEmployeeProfile,
  getTechnicianProfile,
  getUserRoleProfile,
  updateUserRoleProfile,
};

export default profileService;