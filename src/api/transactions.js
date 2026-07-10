import apiClient from './client';

export const fetchTransactions = async () => {
  const response = await apiClient.get('transactions');
  return response.data;
};

export const fetchTransaction = async (id) => {
  const response = await apiClient.get(`transactions/${id}`);
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await apiClient.post('transactions', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await apiClient.put(`transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`transactions/${id}`);
  return response.data;
};
