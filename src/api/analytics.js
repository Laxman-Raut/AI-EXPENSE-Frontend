import apiClient from './client';
import { unwrapApiResponse } from '../utils/apiResponse';

export const fetchMonthlyAnalyticsData = async (range = 'monthly') => {
  const response = await apiClient.get(`analytics/monthly?range=${range}`);
  return unwrapApiResponse(response);
};

export const fetchCategoryAnalyticsData = async (range = 'monthly') => {
  const response = await apiClient.get(`analytics/category?range=${range}`);
  return unwrapApiResponse(response);
};
