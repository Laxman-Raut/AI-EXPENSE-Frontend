import apiClient from './client';

/**
 * Fetch the current user's subscription details.
 * GET /api/subscription
 */
export const getSubscription = async () => {
  const response = await apiClient.get('subscription');
  return response.data;
};

/**
 * Upgrade the user's subscription to Pro.
 * PATCH /api/subscription/upgrade
 */
export const upgradeSubscription = async () => {
  const response = await apiClient.patch('subscription/upgrade');
  return response.data;
};

/**
 * Cancel the user's subscription (revert to Free).
 * PATCH /api/subscription/cancel
 */
export const cancelSubscription = async () => {
  const response = await apiClient.patch('subscription/cancel');
  return response.data;
};
