import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../api/notifications';

const QUERY_KEY = ['notifications'];
// Notifications 2 minute tak fresh maani jaayengi
const NOTIFICATIONS_STALE_TIME = 2 * 60 * 1000;
const NOTIFICATIONS_GC_TIME = 5 * 60 * 1000;

export const useNotifications = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetchNotifications();
      return response.notifications || [];
    },
    staleTime: NOTIFICATIONS_STALE_TIME,
    gcTime: NOTIFICATIONS_GC_TIME,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useClearNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

/**
 * Returns the count of unread notifications — used for badge dots.
 * `select` use kiya hai — sirf count change hone pe re-render hoga,
 * poori notifications list ke re-render pe nahi.
 */
export const useUnreadCount = () => {
  const { data: count = 0 } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetchNotifications();
      return response.notifications || [];
    },
    staleTime: NOTIFICATIONS_STALE_TIME,
    gcTime: NOTIFICATIONS_GC_TIME,
    select: (notifications) => notifications.filter((n) => !n.read).length,
  });
  return count;
};

