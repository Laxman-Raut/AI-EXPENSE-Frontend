import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary, fetchRecentTransactions, fetchMonthlyAnalytics } from '../api/dashboard';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await fetchDashboardSummary();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useRecentTransactions = () => {
  return useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const response = await fetchRecentTransactions();
      return response.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useMonthlyAnalytics = () => {
  return useQuery({
    queryKey: ['monthlyAnalytics'],
    queryFn: async () => {
      const response = await fetchMonthlyAnalytics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
