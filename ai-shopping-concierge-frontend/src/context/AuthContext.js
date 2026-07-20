import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser, getCurrentUser } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore token and session on application start (auto-login)
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await SecureStore.getItemAsync('user_token');
        if (storedToken) {
          setToken(storedToken);
          // Verify token and fetch user details from backend
          const userData = await getCurrentUser();
          setUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // If it's a token validation error (e.g. 401), clear the token
        if (error.response && error.response.status === 401) {
          await SecureStore.deleteItemAsync('user_token');
          setToken(null);
          setUser(null);
          setIsLoggedIn(false);
        }
        // For connection errors, we do not clear the token but remain logged out for safety
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      await SecureStore.setItemAsync('user_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setIsLoggedIn(true);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await registerUser(name, email, password);
      await SecureStore.setItemAsync('user_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setIsLoggedIn(true);
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user_token');
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error clearing JWT token during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, isLoggedIn, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
