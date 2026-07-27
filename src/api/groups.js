import apiClient from './client';

/**
 * Create a new group
 * @param {Object} data { name, description, avatar }
 */
export const createGroup = async (data) => {
  const response = await apiClient.post('/groups', data);
  return response.data;
};

/**
 * Get all groups for current authenticated user
 */
export const getGroups = async () => {
  const response = await apiClient.get('/groups');
  return response.data;
};

/**
 * Get group details by ID
 * @param {string} groupId
 */
export const getGroupById = async (groupId) => {
  const response = await apiClient.get(`/groups/${groupId}`);
  return response.data;
};

/**
 * Update group details
 * @param {string} groupId
 * @param {Object} data { name, description, avatar }
 */
export const updateGroup = async (groupId, data) => {
  const response = await apiClient.put(`/groups/${groupId}`, data);
  return response.data;
};

/**
 * Delete a group
 * @param {string} groupId
 */
export const deleteGroup = async (groupId) => {
  const response = await apiClient.delete(`/groups/${groupId}`);
  return response.data;
};

/**
 * Add a member to a group
 * @param {string} groupId
 * @param {string} memberId
 */
export const addMember = async (groupId, memberId) => {
  const response = await apiClient.post(`/groups/${groupId}/members`, { memberId });
  return response.data;
};

/**
 * Remove a member from a group
 * @param {string} groupId
 * @param {string} memberId
 */
export const removeMember = async (groupId, memberId) => {
  const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
  return response.data;
};

/**
 * Leave a group
 * @param {string} groupId
 */
export const leaveGroup = async (groupId) => {
  const response = await apiClient.delete(`/groups/${groupId}/leave`);
  return response.data;
};
