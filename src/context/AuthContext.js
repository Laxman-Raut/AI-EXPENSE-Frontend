import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalCurrency } from '../utils/formatCurrency';
import {
  checkStoredAuth,
  login as loginThunk,
  googleLogin as googleLoginThunk,
  register as registerThunk,
  verifyRegistrationOtp as verifyRegistrationOtpThunk,
  logout as logoutThunk,
  updateUser as updateUserThunk,
  refreshProfile as refreshProfileThunk,
} from '../store/authSlice';

import { queryClient } from '../../App';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { user, token, isLoading, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkStoredAuth());
  }, [dispatch]);

  // Sync global currency & clear cache when user ID or currency changes
  useEffect(() => {
    if (user && user._id) {
      if (user.currency) {
        setGlobalCurrency(user.currency);
      }
    }
  }, [user?._id, user?.currency]);

  const login = async (email, password) => {
    queryClient.clear();
    const result = await dispatch(loginThunk({ email, password })).unwrap();
    return result;
  };

  const googleLogin = async (googleData) => {
    queryClient.clear();
    const result = await dispatch(googleLoginThunk(googleData)).unwrap();
    return result;
  };

  const register = async (fullName, email, password) => {
    queryClient.clear();
    const result = await dispatch(registerThunk({ fullName, email, password })).unwrap();
    return result;
  };

  const verifyOtp = async (email, otp) => {
    queryClient.clear();
    const result = await dispatch(verifyRegistrationOtpThunk({ email, otp })).unwrap();
    return result;
  };

  const logout = async () => {
    queryClient.clear();
    await dispatch(logoutThunk()).unwrap();
  };

  const refreshProfile = async () => {
    await dispatch(refreshProfileThunk()).unwrap();
  };

  const updateUser = async (data) => {
    const result = await dispatch(updateUserThunk(data)).unwrap();
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        googleLogin,
        register,
        verifyOtp,
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
