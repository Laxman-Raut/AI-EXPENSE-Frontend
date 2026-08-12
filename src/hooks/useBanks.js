import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bankApi from '../api/bank';

export const useBanks = () => {
  const queryClient = useQueryClient();

  const {
    data: banks = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const res = await bankApi.getBanks();
      return (res && res.success) ? (res.data || []) : [];
    },
  });

  const invalidateBanks = () => {
    queryClient.invalidateQueries({ queryKey: ['banks'] });
  };

  const addMutation = useMutation({
    mutationFn: (bankData) => bankApi.createBank(bankData),
    onSuccess: () => invalidateBanks(),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, bankData }) => bankApi.updateBank(id, bankData),
    onSuccess: () => invalidateBanks(),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => bankApi.deleteBank(id),
    onSuccess: () => invalidateBanks(),
  });

  const makePrimaryMutation = useMutation({
    mutationFn: (id) => bankApi.setPrimaryBank(id),
    onSuccess: () => invalidateBanks(),
  });

  return {
    banks,
    loading,
    error: error?.message || null,
    refetch,
    addBank: (bankData) => addMutation.mutateAsync(bankData),
    editBank: (id, bankData) => editMutation.mutateAsync({ id, bankData }),
    removeBank: (id) => removeMutation.mutateAsync(id),
    makePrimary: (id) => makePrimaryMutation.mutateAsync(id),
  };
};

export default useBanks;
