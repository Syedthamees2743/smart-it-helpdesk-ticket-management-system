import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // HELPER FUNCTION: Just clears the storage and state (prevents infinite loops)
  const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // FUNCTION: Get current logged-in user from Django
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me/');
      const userData = response.data;
      
      // 1. Update React State
      setUser(userData);
      
      // 2. CRITICAL FIX: Save to Local Storage so Login.jsx can read the role for redirect!
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (error) {
      console.error("Error fetching user:", error);
      clearAuthData(); // Use the helper instead of calling logout() here
    } finally {
      setLoading(false); 
    }
  };

  // RUN ONCE ON APP START
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      getCurrentUser(); 
    } else {
      setLoading(false); 
    }
  }, []);

  // FUNCTION: Login
  const login = async (username, password) => {
    try {
      // 1. Get Tokens
      const tokenResponse = await api.post('/auth/login/', { username, password });
      const { access, refresh } = tokenResponse.data;

      // 2. Store Tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // 3. Get User Details (This now safely saves to Local Storage too)
      await getCurrentUser();
      
      return true; 
    } catch (error) {
      // Throw the backend error message so Login page can show it
      throw error.response?.data || { detail: "Login failed." };
    }
  };

  // FUNCTION: Logout
  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
      // Tell Django to blacklist the refresh token
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Logout API failed, clearing locally.", error);
    } finally {
      // Always clear local state
      clearAuthData();
    }
  };

  const contextData = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use the AuthContext in any component
export const useAuth = () => {
  return useContext(AuthContext);
};