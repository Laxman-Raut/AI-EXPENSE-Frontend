import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getGroupSplitRequests,
  getSplitRequestById,
  createSplitRequest,
  updateSplitRequest,
  deleteSplitRequest,
} from '../api/splitRequests';

export const useGroupSplitRequests = (groupId, currentUserId) => {
  const [splitRequests, setSplitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSplits = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGroupSplitRequests(groupId);
      setSplitRequests(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load split requests');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  const handleCreateSplit = async (data) => {
    const res = await createSplitRequest(data);
    await fetchSplits();
    return res.data;
  };

  const handleUpdateSplit = async (splitId, updateData) => {
    const res = await updateSplitRequest(splitId, updateData);
    await fetchSplits();
    return res.data;
  };

  const handleDeleteSplit = async (splitId) => {
    await deleteSplitRequest(splitId);
    await fetchSplits();
  };

  // Calculate user balance summary ("You owe", "You are owed")
  const balanceSummary = useMemo(() => {
    let owedToMe = 0;
    let iOwe = 0;

    splitRequests.forEach((split) => {
      const paidById = typeof split.paidBy === 'object' ? split.paidBy._id || split.paidBy.id : split.paidBy;
      const isPayer = currentUserId && String(paidById) === String(currentUserId);

      split.participants?.forEach((p) => {
        const pUserId = typeof p.user === 'object' ? p.user._id || p.user.id : p.user;
        const isMe = currentUserId && String(pUserId) === String(currentUserId);

        if (isPayer && !isMe && p.status !== 'paid') {
          owedToMe += Number(p.amount || 0);
        } else if (!isPayer && isMe && p.status !== 'paid') {
          iOwe += Number(p.amount || 0);
        }
      });
    });

    return {
      owedToMe: Number(owedToMe.toFixed(2)),
      iOwe: Number(iOwe.toFixed(2)),
      netBalance: Number((owedToMe - iOwe).toFixed(2)),
    };
  }, [splitRequests, currentUserId]);

  return {
    splitRequests,
    loading,
    error,
    refetch: fetchSplits,
    createSplit: handleCreateSplit,
    updateSplit: handleUpdateSplit,
    deleteSplit: handleDeleteSplit,
    balanceSummary,
  };
};

export const useSplitDetail = (splitId) => {
  const [splitRequest, setSplitRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!splitId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSplitRequestById(splitId);
      setSplitRequest(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load split expense detail');
    } finally {
      setLoading(false);
    }
  }, [splitId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    splitRequest,
    loading,
    error,
    refetch: fetchDetail,
    setSplitRequest,
  };
};
