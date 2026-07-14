import apiClient from './client';

export const fetchNotifications = async () => {
  const response = await apiClient.get('notifications');
  return response.data;
};

export const createNotification = async (data) => {
  const response = await apiClient.post('notifications', data);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await apiClient.patch(`notifications/${id}/read`);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await apiClient.delete('notifications');
  return response.data;
};
