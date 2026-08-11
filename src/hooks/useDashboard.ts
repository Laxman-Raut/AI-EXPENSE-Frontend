import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary, fetchRecentTransactions } from '../services/dashboardService';
import { fetchMonthlyAnalytics } from '../api/dashboard';
import { getGlobalCurrency } from '../utils/formatCurrency';

export const useDashboardSummary = (currency: string | null = null) => {
  const activeCurrency = currency || getGlobalCurrency() || 'INR';

  return useQuery({
    queryKey: ['dashboardSummary', activeCurrency],
    queryFn: async () => {
      return await fetchDashboardSummary();
    },
    staleTime: 0,
  });
};

export const useRecentTransactions = (currency: string | null = null) => {
  const activeCurrency = currency || getGlobalCurrency() || 'INR';

  return useQuery({
    queryKey: ['recentTransactions', activeCurrency],
    queryFn: async () => {
      return await fetchRecentTransactions();
    },
    staleTime: 0,
  });
};

export const useMonthlyAnalytics = () => {
  return useQuery({
    queryKey: ['monthlyAnalytics'],
    queryFn: async () => {
      return await fetchMonthlyAnalytics();
    },
  });
};
