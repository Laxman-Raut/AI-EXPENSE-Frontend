import apiClient from './client';
import { unwrapApiResponse } from '../utils/apiResponse';

export const fetchMonthlyAnalyticsData = async (params = 'monthly') => {
  const query = typeof params === 'string'
    ? `range=${params}`
    : Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
  const response = await apiClient.get(`analytics/monthly?${query}`);
  return unwrapApiResponse(response);
};

export const fetchCategoryAnalyticsData = async (params = 'monthly') => {
  const query = typeof params === 'string'
    ? `range=${params}`
    : Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
  const response = await apiClient.get(`analytics/category?${query}`);
  return unwrapApiResponse(response);
};
