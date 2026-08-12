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

  const invalidateBanks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['banks'] });
    await queryClient.refetchQueries({ queryKey: ['banks'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
  };

  const addMutation = useMutation({
    mutationFn: (bankData) => bankApi.createBank(bankData),
    onSuccess: (res) => {
      if (res?.data) {
        queryClient.setQueryData(['banks'], (old = []) => {
          const list = Array.isArray(old) ? old : [];
          if (list.some((b) => b._id === res.data._id)) return list;
          return [res.data, ...list];
        });
      }
      invalidateBanks();
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, bankData }) => bankApi.updateBank(id, bankData),
    onSuccess: (res, variables) => {
      if (res?.data) {
        queryClient.setQueryData(['banks'], (old = []) => {
          const list = Array.isArray(old) ? old : [];
          return list.map((b) => (b._id === variables.id ? { ...b, ...res.data } : b));
        });
      }
      invalidateBanks();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => bankApi.deleteBank(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['banks'], (old = []) => {
        const list = Array.isArray(old) ? old : [];
        return list.filter((b) => b._id !== id);
      });
      invalidateBanks();
    },
  });

  const makePrimaryMutation = useMutation({
    mutationFn: (id) => bankApi.setPrimaryBank(id),
    onSuccess: (res, id) => {
      queryClient.setQueryData(['banks'], (old = []) => {
        const list = Array.isArray(old) ? old : [];
        return list.map((b) => ({
          ...b,
          isPrimary: b._id === id,
        }));
      });
      invalidateBanks();
    },
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
