import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User } from '../types';
import { setGlobalCurrency } from '../utils/formatCurrency';
import {
  checkStoredAuth,
  login as loginThunk,
  register as registerThunk,
  logout as logoutThunk,
  updateUser as updateUserThunk,
  refreshProfile as refreshProfileThunk,
} from '../store/authSlice';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading, isAuthenticated } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<any>();

  useEffect(() => {
    dispatch(checkStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    if (user && user.currency) {
      setGlobalCurrency(user.currency);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<void> => {
    await dispatch((loginThunk as any)({ email, password })).unwrap();
  };

  const register = async (fullName: string, email: string, password: string): Promise<void> => {
    await dispatch((registerThunk as any)({ fullName, email, password })).unwrap();
  };

  const logout = async (): Promise<void> => {
    await dispatch((logoutThunk as any)()).unwrap();
  };

  const refreshProfile = async (): Promise<void> => {
    await dispatch((refreshProfileThunk as any)()).unwrap();
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    await dispatch((updateUserThunk as any)(data)).unwrap();
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
