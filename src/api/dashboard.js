import apiClient from './client';
import { unwrapApiResponse } from '../utils/apiResponse';

export const fetchDashboardSummary = async () => {
  const response = await apiClient.get('dashboard', { timeout: 10000 });
  return unwrapApiResponse(response);
};

export const fetchRecentTransactions = async () => {
  const response = await apiClient.get('dashboard/recent', { timeout: 10000 });
  return unwrapApiResponse(response);
};

export const fetchMonthlyAnalytics = async () => {
  const response = await apiClient.get('analytics/monthly?range=monthly', { timeout: 10000 });
  return unwrapApiResponse(response);
};
