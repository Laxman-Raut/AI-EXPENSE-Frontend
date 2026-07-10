import apiClient from './client';
import { ApiResponse, Transaction, CreateTransactionData } from '../types';

export const fetchTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  const response = await apiClient.get('transactions');
  return response.data;
};

export const fetchTransaction = async (id: string): Promise<ApiResponse<Transaction>> => {
  const response = await apiClient.get(`transactions/${id}`);
  return response.data;
};

export const createTransaction = async (
  data: CreateTransactionData,
): Promise<ApiResponse<Transaction>> => {
  const response = await apiClient.post('transactions', data);
  return response.data;
};

export const updateTransaction = async (
  id: string,
  data: CreateTransactionData,
): Promise<ApiResponse<Transaction>> => {
  const response = await apiClient.put(`transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (
  id: string,
): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`transactions/${id}`);
  return response.data;
};
