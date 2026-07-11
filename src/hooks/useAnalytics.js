import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyAnalyticsData, fetchCategoryAnalyticsData } from '../api/analytics';

export const useMonthlyAnalyticsData = (range = 'monthly') => {
  return useQuery({
    queryKey: ['monthlyAnalyticsData', range],
    queryFn: async () => {
      const response = await fetchMonthlyAnalyticsData(range);
      return response.data;
    },
  });
};

export const useCategoryAnalyticsData = (range = 'monthly') => {
  return useQuery({
    queryKey: ['categoryAnalyticsData', range],
    queryFn: async () => {
      const response = await fetchCategoryAnalyticsData(range);
      return response.data;
    },
  });
};
