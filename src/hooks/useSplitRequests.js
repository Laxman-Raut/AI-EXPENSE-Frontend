import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getGroupSplitRequests,
  getSplitRequestById,
  createSplitRequest,
  updateSplitRequest,
  deleteSplitRequest,
} from '../api/splitRequests';

export const useGroupSplitRequests = (groupId, currentUserId, activeCurrency = 'INR') => {
  const [splitRequests, setSplitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSplits = useCallback(async (isSilent = false) => {
    if (!groupId) return;
    if (!isSilent) setLoading(true);
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
    fetchSplits(true);
    return res.data;
  };

  const handleUpdateSplit = async (splitId, updateData) => {
    const res = await updateSplitRequest(splitId, updateData);
    fetchSplits(true);
    return res.data;
  };

  const handleDeleteSplit = async (splitId) => {
    await deleteSplitRequest(splitId);
    fetchSplits(true);
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

        // Pick the correct amount based on active currency
        const amt = Number(
          (activeCurrency === 'USD' && p.amountUSD != null) ? p.amountUSD :
          (activeCurrency !== 'USD' && p.amountINR != null) ? p.amountINR :
          p.amount || 0
        );

        if (isPayer && !isMe && p.status !== 'paid') {
          owedToMe += amt;
        } else if (!isPayer && isMe && p.status !== 'paid') {
          iOwe += amt;
        }
      });
    });

    return {
      owedToMe: Number(owedToMe.toFixed(2)),
      iOwe: Number(iOwe.toFixed(2)),
      netBalance: Number((owedToMe - iOwe).toFixed(2)),
    };
  }, [splitRequests, currentUserId, activeCurrency]);

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

  const fetchDetail = useCallback(async (isSilent = false) => {
    if (!splitId) return;
    if (!isSilent) setLoading(true);
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
