import apiClient from './client';
import { ApiResponse, DashboardSummary, Transaction, MonthlyAnalytics } from '../types';

export const fetchDashboardSummary = async (): Promise<ApiResponse<DashboardSummary>> => {
  const response = await apiClient.get('/dashboard');
  return response.data;
};

export const fetchRecentTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  const response = await apiClient.get('/dashboard/recent');
  return response.data;
};

export const fetchMonthlyAnalytics = async (): Promise<ApiResponse<MonthlyAnalytics[]>> => {
  const response = await apiClient.get('/dashboard/monthly');
  return response.data;
};
