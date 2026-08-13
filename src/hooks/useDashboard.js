import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary, fetchRecentTransactions } from '../services/dashboardService';
import { fetchMonthlyAnalytics } from '../api/dashboard';
import { getGlobalCurrency } from '../utils/formatCurrency';

// 5 minutes tak data fresh maana jaayega — screen focus pe unnecessary refetch nahi hoga
const DASHBOARD_STALE_TIME = 5 * 60 * 1000;
const DASHBOARD_GC_TIME = 10 * 60 * 1000;

export const useDashboardSummary = (currency = null) => {
  const activeCurrency = currency || getGlobalCurrency() || 'INR';

  return useQuery({
    queryKey: ['dashboardSummary', activeCurrency],
    queryFn: async () => {
      return await fetchDashboardSummary();
    },
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
  });
};

export const useRecentTransactions = (currency = null) => {
  const activeCurrency = currency || getGlobalCurrency() || 'INR';

  return useQuery({
    queryKey: ['recentTransactions', activeCurrency],
    queryFn: async () => {
      return await fetchRecentTransactions();
    },
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
  });
};

export const useMonthlyAnalytics = () => {
  return useQuery({
    queryKey: ['monthlyAnalytics'],
    queryFn: async () => {
      return await fetchMonthlyAnalytics();
    },
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
  });
};
