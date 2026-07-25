import { useState, useEffect, useCallback } from 'react';
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from '../api/friends';

// Hook to manage full friends state
export const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        getFriends(),
        getPendingRequests(),
      ]);
      setFriends(friendsRes.data || []);
      setPendingRequests(pendingRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const accept = async (requestId) => {
    await acceptFriendRequest(requestId);
    await fetchAll();
  };

  const reject = async (requestId) => {
    await rejectFriendRequest(requestId);
    await fetchAll();
  };

  const remove = async (friendId) => {
    await removeFriend(friendId);
    await fetchAll();
  };

  return {
    friends,
    pendingRequests,
    loading,
    error,
    refetch: fetchAll,
    accept,
    reject,
    remove,
  };
};

// Hook for user search
export const useUserSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchUsers(query.trim());
      setResults(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const send = async (recipientId) => {
    await sendFriendRequest(recipientId);
  };

  return { results, loading, error, search, send };
};
