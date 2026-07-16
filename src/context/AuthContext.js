import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGlobalCurrency } from '../utils/formatCurrency';
import {
  checkStoredAuth,
  login as loginThunk,
  register as registerThunk,
  logout as logoutThunk,
  updateUser as updateUserThunk,
  refreshProfile as refreshProfileThunk,
} from '../store/authSlice';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { user, token, isLoading, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (user && user.currency) {
      setGlobalCurrency(user.currency);
    }
  }, [user]);

  const login = async (email, password) => {
    const result = await dispatch(loginThunk({ email, password })).unwrap();
    return result;
  };

  const register = async (fullName, email, password) => {
    const result = await dispatch(registerThunk({ fullName, email, password })).unwrap();
    return result;
  };

  const logout = async () => {
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
