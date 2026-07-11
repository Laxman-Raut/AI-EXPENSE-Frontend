import apiClient from './client';

export const fetchMonthlyAnalyticsData = async (range = 'monthly') => {
  const response = await apiClient.get(`analytics/monthly?range=${range}`);
  return response.data;
};

export const fetchCategoryAnalyticsData = async (range = 'monthly') => {
  const response = await apiClient.get(`analytics/category?range=${range}`);
  return response.data;
};
