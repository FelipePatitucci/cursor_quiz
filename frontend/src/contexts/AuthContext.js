import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile, login, logout, register } from '../services/api';

// Create context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from the server when the app loads
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await getUserProfile();
        setUser(response.data);
        setError(null);
      } catch (err) {
        setUser(null);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const handleLogin = async (username, password) => {
    try {
      setLoading(true);
      const response = await login(username, password);
      
      // Fetch the user profile after successful login
      const profileResponse = await getUserProfile();
      setUser(profileResponse.data);
      setError(null);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const handleRegister = async (username, password, anilistUsername) => {
    try {
      setLoading(true);
      const response = await register(username, password, anilistUsername);
      
      // Fetch the user profile after successful registration
      const profileResponse = await getUserProfile();
      setUser(profileResponse.data);
      setError(null);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 