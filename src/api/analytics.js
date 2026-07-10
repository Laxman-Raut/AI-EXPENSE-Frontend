import apiClient from './client';

// Category-wise spending
export const fetchCategoryAnalytics = async (range = 'monthly') => {
  try {
    const response = await apiClient.get(`/dashboard/category?range=${range}`);
    return response.data;
  } catch (error) {
    console.warn('Category analytics API error:', error.message);
    return { success: true, data: [] };
  }
};

// Monthly analytics
export const fetchAnalyticsReport = async (range = 'monthly') => {
  try {
    const response = await apiClient.get(`/dashboard/monthly?range=${range}`);
    return response.data;
  } catch (error) {
    console.warn('Analytics API error:', error.message);
    return { success: true, data: [] };
  }
};

// Yearly comparison report
export const fetchYearlyComparison = async () => {
  try {
    const response = await apiClient.get('/dashboard/yearly');
    return response.data;
  } catch (error) {
    console.warn('Yearly comparison API error:', error.message);
    return { success: false, data: null };
  }
};

// Budget utilization and savings stats
export const fetchBudgetUtilization = async (range = 'monthly') => {
  try {
    const response = await apiClient.get(`/dashboard/budget?range=${range}`);
    return response.data;
  } catch (error) {
    console.warn('Budget utilization API error:', error.message);
    return { success: true, data: null };
  }
};
