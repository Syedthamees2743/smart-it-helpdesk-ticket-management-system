import api from './api';

const authService = {
    // ==================== SIGNUP ====================
    
    employeeSignup: async (data) => {
        const response = await api.post('/auth/signup/employee/', data);
        return response.data;
    },
    
    technicianSignup: async (data) => {
        const response = await api.post('/auth/signup/technician/', data);
        return response.data;
    },
    
    // ==================== ACTIVATION ====================
    
    validateActivationToken: async (token) => {
        const response = await api.get(`/auth/activate/${token}/`);
        return response.data;
    },
    
    activateAccount: async (token, data) => {
        const response = await api.post(`/auth/activate/${token}/`, data);
        return response.data;
    },
    
    resendActivationLink: async (email) => {
        const response = await api.post('/auth/activate/resend/', { email });
        return response.data;
    },
    
    // ==================== ADMIN - PENDING USERS ====================
    
    getPendingUsers: async () => {
        const response = await api.get('/auth/users/pending/');
        return response.data;
    },
    
    approveUser: async (userId) => {
        const response = await api.post(`/auth/users/${userId}/approve/`);
        return response.data;
    },
    
    rejectUser: async (userId, reason = '') => {
        const response = await api.post(`/auth/users/${userId}/reject/`, { reason });
        return response.data;
    },
    
    // ==================== DEPARTMENTS (PUBLIC - for signup) ====================
    
    getDepartments: async () => {
        // Use PUBLIC endpoint - no auth required
        const response = await api.get('/departments/public/');
        return response.data;
    },
};

export default authService;