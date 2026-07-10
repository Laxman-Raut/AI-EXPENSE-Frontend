import apiClient from './client';

export const registerUser = async (fullName, email, password) => {
  const response = await apiClient.post('auth/register', {
    fullName,
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await apiClient.post('auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await apiClient.put('auth/profile', data);
  return response.data;
};
