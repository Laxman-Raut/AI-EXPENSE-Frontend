import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecurringTransactions,
  fetchRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransactionStatus,
} from '../api/recurringTransactions';

export const useRecurringTransactions = () => {
  return useQuery({
    queryKey: ['recurringTransactions'],
    queryFn: async () => {
      const response = await fetchRecurringTransactions();
      return response.data;
    },
  });
};

export const useRecurringTransaction = (id) => {
  return useQuery({
    queryKey: ['recurringTransaction', id],
    queryFn: async () => {
      const response = await fetchRecurringTransaction(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createRecurringTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRecurringTransaction(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringTransaction', variables.id] });
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteRecurringTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
};

export const useToggleRecurringTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => toggleRecurringTransactionStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurringTransaction', variables.id] });
    },
  });
};
