import apiClient from './client';

/**
 * Create a new split expense request
 * @param {Object} data { title, description, totalAmount, group, paidBy, splitType, participants }
 */
export const createSplitRequest = async (data) => {
  const response = await apiClient.post('/split-requests', data);
  return response.data;
};

/**
 * Get all split requests for a specific group
 * @param {string} groupId
 */
export const getGroupSplitRequests = async (groupId) => {
  const response = await apiClient.get(`/split-requests/group/${groupId}`);
  return response.data;
};

/**
 * Get single split request details
 * @param {string} splitId
 */
export const getSplitRequestById = async (splitId) => {
  const response = await apiClient.get(`/split-requests/${splitId}`);
  return response.data;
};

/**
 * Update a split request (e.g. update participant status or details)
 * @param {string} splitId
 * @param {Object} updateData
 */
export const updateSplitRequest = async (splitId, updateData) => {
  const response = await apiClient.put(`/split-requests/${splitId}`, updateData);
  return response.data;
};

/**
 * Delete a split request
 * @param {string} splitId
 */
export const deleteSplitRequest = async (splitId) => {
  const response = await apiClient.delete(`/split-requests/${splitId}`);
  return response.data;
};
