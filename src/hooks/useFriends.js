import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from '../api/friends';

// Hook to manage full friends state via React Query
export const useFriends = () => {
  const queryClient = useQueryClient();

  const {
    data: friends = [],
    isLoading: loadingFriends,
    error: friendsError,
    refetch: refetchFriends,
  } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await getFriends();
      return res.data || [];
    },
    refetchInterval: 30000, // Safe background polling every 30s
  });

  const {
    data: pendingRequests = [],
    isLoading: loadingPending,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: async () => {
      const res = await getPendingRequests();
      return res.data || [];
    },
    refetchInterval: 30000,
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
  }, [queryClient]);

  const acceptMutation = useMutation({
    mutationFn: (requestId) => acceptFriendRequest(requestId),
    onSuccess: () => invalidateAll(),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => rejectFriendRequest(requestId),
    onSuccess: () => invalidateAll(),
  });

  const removeMutation = useMutation({
    mutationFn: (friendId) => removeFriend(friendId),
    onSuccess: () => invalidateAll(),
  });

  const fetchAll = useCallback(async () => {
    await Promise.all([refetchFriends(), refetchPending()]);
  }, [refetchFriends, refetchPending]);

  return {
    friends,
    pendingRequests,
    loading: loadingFriends || loadingPending,
    error: (friendsError || pendingError)?.message || null,
    refetch: fetchAll,
    accept: (requestId) => acceptMutation.mutateAsync(requestId),
    reject: (requestId) => rejectMutation.mutateAsync(requestId),
    remove: (friendId) => removeMutation.mutateAsync(friendId),
  };
};

// Hook for user search
export const useUserSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    try {
      const res = await searchUsers(query.trim(), { signal: abortRef.current.signal });
      setResults(res.data || []);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.message === 'canceled') {
        return; // Ignore canceled requests
      }
      setError(err?.response?.data?.message || 'Search failed');
    } finally {
      // Only stop loading if we haven't been aborted
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const send = async (recipientId) => {
    await sendFriendRequest(recipientId);
  };

  return { results, loading, error, search, send };
};
