import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import savingsApi from '../api/savings';
import { getGlobalCurrency } from '../utils/formatCurrency';

export const useSavingsJars = (status = null, currency = null) => {
  const activeCurrency = currency || getGlobalCurrency() || 'INR';

  return useQuery({
    queryKey: ['savingsJars', status, activeCurrency],
    queryFn: async () => {
      const res = await savingsApi.getSavingsJars(status);
      return res;
    },
    // Savings jars 5 min tak cache fresh hain
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useSavingsDetails = (jarId) => {
  return useQuery({
    queryKey: ['savingsJar', jarId],
    queryFn: async () => {
      if (!jarId) return null;
      const res = await savingsApi.getJarById(jarId);
      return res?.data || res;
    },
    enabled: !!jarId,
  });
};

export const useDepositToJar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => savingsApi.depositToJar(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savingsJars'] });
      queryClient.invalidateQueries({ queryKey: ['savingsJar', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};

export const useWithdrawFromJar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => savingsApi.withdrawFromJar(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['savingsJars'] });
      queryClient.invalidateQueries({ queryKey: ['savingsJar', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};

export const useTransferSavings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => savingsApi.transferMoney(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsJars'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
};

