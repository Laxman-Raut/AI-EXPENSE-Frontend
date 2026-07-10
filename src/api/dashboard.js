import apiClient from './client';

export const fetchDashboardSummary = async () => {
  const response = await apiClient.get('dashboard');
  return response.data;
};

export const fetchRecentTransactions = async () => {
  const response = await apiClient.get('dashboard/recent');
  return response.data;
};

export const fetchMonthlyAnalytics = async () => {
  const response = await apiClient.get('dashboard/monthly');
  return response.data;
};
