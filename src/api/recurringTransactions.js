import apiClient from './client';

export const fetchRecurringTransactions = async () => {
  const response = await apiClient.get('recurring-transactions');
  return response.data;
};

export const fetchRecurringTransaction = async (id) => {
  const response = await apiClient.get(`recurring-transactions/${id}`);
  return response.data;
};

export const createRecurringTransaction = async (data) => {
  const response = await apiClient.post('recurring-transactions', data);
  return response.data;
};

export const updateRecurringTransaction = async (id, data) => {
  const response = await apiClient.put(`recurring-transactions/${id}`, data);
  return response.data;
};

export const deleteRecurringTransaction = async (id) => {
  const response = await apiClient.delete(`recurring-transactions/${id}`);
  return response.data;
};

export const toggleRecurringTransactionStatus = async (id, status) => {
  const response = await apiClient.patch(`recurring-transactions/${id}/status`, { status });
  return response.data;
};
