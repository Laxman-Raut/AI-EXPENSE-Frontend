import apiClient from './client';
import { ApiResponse, LoginResponse, User } from '../types';

export const registerUser = async (
  fullName: string,
  email: string,
  password: string,
): Promise<ApiResponse<User>> => {
  const response = await apiClient.post('auth/register', {
    fullName,
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post('auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getProfile = async (): Promise<ApiResponse<User>> => {
  const response = await apiClient.get('auth/me');
  return response.data;
};
