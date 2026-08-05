import apiClient from './client';

/**
 * Get all savings jars for the logged-in user
 * @param {string} [status] - Optional filter ('active', 'completed', 'archived')
 */
export const getSavingsJars = async (status) => {
  const url = status ? `/savings?status=${status}` : '/savings';
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Get details for a single savings jar
 * @param {string} id
 */
export const getJarById = async (id) => {
  const response = await apiClient.get(`/savings/${id}`);
  return response.data;
};

/**
 * Create a new savings jar
 * @param {Object} data { name, icon, color, targetAmount, notes }
 */
export const createJar = async (data) => {
  const response = await apiClient.post('/savings', data);
  return response.data;
};

/**
 * Update an existing savings jar
 * @param {string} id
 * @param {Object} data
 */
export const updateJar = async (id, data) => {
  const response = await apiClient.patch(`/savings/${id}`, data);
  return response.data;
};

/**
 * Delete a savings jar
 * @param {string} id
 */
export const deleteJar = async (id) => {
  const response = await apiClient.delete(`/savings/${id}`);
  return response.data;
};

/**
 * Deposit funds into a savings jar
 * @param {string} id
 * @param {Object} payload { amount, notes }
 */
export const depositToJar = async (id, payload) => {
  const response = await apiClient.post(`/savings/${id}/deposit`, payload);
  return response.data;
};

/**
 * Withdraw funds from a savings jar
 * @param {string} id
 * @param {Object} payload { amount, notes }
 */
export const withdrawFromJar = async (id, payload) => {
  const response = await apiClient.post(`/savings/${id}/withdraw`, payload);
  return response.data;
};

/**
 * Transfer funds between two savings jars
 * @param {Object} payload { fromJarId, toJarId, amount, notes }
 */
export const transferMoney = async (payload) => {
  const response = await apiClient.post('/savings/transfer', payload);
  return response.data;
};

/**
 * Get AI Savings Suggestions
 */
export const getAISuggestions = async () => {
  const response = await apiClient.get('/savings/suggestions');
  return response.data;
};

export default {
  getSavingsJars,
  getJarById,
  createJar,
  updateJar,
  deleteJar,
  depositToJar,
  withdrawFromJar,
  transferMoney,
  getAISuggestions,
};
