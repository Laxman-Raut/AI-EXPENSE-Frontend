import apiClient from './client';
import { unwrapApiResponse } from '../utils/apiResponse';

export const fetchDashboardSummary = async () => {
  const response = await apiClient.get('dashboard');
  return unwrapApiResponse(response);
};

export const fetchRecentTransactions = async () => {
  const response = await apiClient.get('dashboard/recent');
  return unwrapApiResponse(response);
};

export const fetchMonthlyAnalytics = async () => {
  const response = await apiClient.get('dashboard/monthly');
  return unwrapApiResponse(response);
};
