import apiClient from './client';

/**
 * Fetch all public/active plans from the backend.
 * GET /v1/plans/public
 * No authentication required.
 */
export const getPublicPlans = async () => {
  const response = await apiClient.get('v1/plans/public');
  return response.data;
};
