import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ============================================
    // FIX #1: Skip refresh logic for LOGIN endpoint
    // Login 401 = wrong credentials, NOT expired token
    // ============================================
    const isLoginEndpoint = originalRequest.url?.includes('/auth/login/');
    
    if (isLoginEndpoint) {
      // Just pass the error to the component - don't try to refresh
      return Promise.reject(error);
    }

    // ============================================
    // FIX #2: Only try refresh if user was actually logged in
    // ============================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      // No refresh token = user wasn't logged in, just reject
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken
        });
        
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // ============================================
        // FIX #3: Use window.location.replace() instead of href
        // And only if NOT already on login page
        // ============================================
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // All other errors - just reject
    return Promise.reject(error);
  }
);

export default api;