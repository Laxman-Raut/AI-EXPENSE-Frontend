import { useQuery } from '@tanstack/react-query';
import { getPublicPlans } from '../api/plans';

/**
 * React Query hook to fetch and cache public plans.
 * Plans are managed by the super admin from the dashboard.
 * Auto-refreshes every 5 minutes and on screen focus.
 */
export const usePublicPlans = () => {
  return useQuery({
    queryKey: ['publicPlans'],
    queryFn: async () => {
      const response = await getPublicPlans();
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to fetch plans');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};
