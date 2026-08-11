import { useQuery } from '@tanstack/react-query';
import { fetchMonthlyAnalyticsData, fetchCategoryAnalyticsData } from '../api/analytics';

export const useMonthlyAnalyticsData = (range = 'monthly') => {
  return useQuery({
    queryKey: ['monthlyAnalyticsData', range],
    queryFn: async () => {
      return await fetchMonthlyAnalyticsData(range);
    },
  });
};

export const useCategoryAnalyticsData = (range = 'monthly') => {
  return useQuery({
    queryKey: ['categoryAnalyticsData', range],
    queryFn: async () => {
      return await fetchCategoryAnalyticsData(range);
    },
  });
};
