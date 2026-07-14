import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const clearAuth = useCallback(async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const checkStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Validate token by fetching profile
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch {
          // Token invalid — clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  // Check for stored token on mount
  useEffect(() => {
    checkStoredAuth();
  }, [checkStoredAuth]);

  const login = useCallback(async (email, password) => {
    const response = await authApi.loginUser(email, password);

    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data;
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const response = await authApi.registerUser(fullName, email, password);

    if (response.success) {
      // Auto-login after registration
      await login(email, password);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  }, [login]);

  const logout = useCallback(async () => {
    await clearAuth();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }, []);

  const updateUser = useCallback(async (data) => {
    const response = await authApi.updateProfile(data);
    if (response.success && response.data) {
      setUser(response.data);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    } else {
      throw new Error(response.message || 'Profile update failed');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
