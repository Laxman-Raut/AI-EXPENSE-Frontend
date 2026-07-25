import apiClient from './client';

// Search users by name, username or email
export const searchUsers = async (query) => {
  const response = await apiClient.get('/friends/search', { params: { q: query } });
  return response.data;
};

// Send a friend request
export const sendFriendRequest = async (recipientId) => {
  const response = await apiClient.post('/friends/request', { recipientId });
  return response.data;
};

// Accept a friend request
export const acceptFriendRequest = async (requestId) => {
  const response = await apiClient.post('/friends/accept', { requestId });
  return response.data;
};

// Reject a friend request
export const rejectFriendRequest = async (requestId) => {
  const response = await apiClient.post('/friends/reject', { requestId });
  return response.data;
};

// Get pending incoming friend requests
export const getPendingRequests = async () => {
  const response = await apiClient.get('/friends/requests');
  return response.data;
};

// Get friends list
export const getFriends = async () => {
  const response = await apiClient.get('/friends');
  return response.data;
};

// Remove a friend
export const removeFriend = async (friendId) => {
  const response = await apiClient.delete(`/friends/${friendId}`);
  return response.data;
};
