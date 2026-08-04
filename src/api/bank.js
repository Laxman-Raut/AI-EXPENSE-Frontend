import apiClient from './client';

/**
 * Get all bank accounts of the user
 */
export const getBanks = async () => {
  const response = await apiClient.get('/banks');
  return response.data;
};

/**
 * Get single bank account details
 * @param {string} id
 */
export const getBankById = async (id) => {
  const response = await apiClient.get(`/banks/${id}`);
  return response.data;
};

/**
 * Create a new bank account
 * @param {Object} data { bankName, bankCode, accountHolderName, accountNumber, accountType, nickname, upiId, isPrimary }
 */
export const createBank = async (data) => {
  const response = await apiClient.post('/banks', data);
  return response.data;
};

/**
 * Update an existing bank account
 * @param {string} id
 * @param {Object} data
 */
export const updateBank = async (id, data) => {
  const response = await apiClient.patch(`/banks/${id}`, data);
  return response.data;
};

/**
 * Delete a bank account
 * @param {string} id
 */
export const deleteBank = async (id) => {
  const response = await apiClient.delete(`/banks/${id}`);
  return response.data;
};

/**
 * Set a bank account as primary
 * @param {string} id
 */
export const setPrimaryBank = async (id) => {
  const response = await apiClient.patch(`/banks/${id}/primary`);
  return response.data;
};

export default {
  getBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  setPrimaryBank,
};
