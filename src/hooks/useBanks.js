import { useState, useEffect, useCallback } from 'react';
import bankApi from '../api/bank';

export const useBanks = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBanks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await bankApi.getBanks();
      if (res && res.success) {
        setBanks(res.data || []);
      } else {
        setBanks([]);
      }
    } catch (err) {
      console.log('[useBanks] Error fetching banks:', err);
      setError(err?.response?.data?.message || 'Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const addBank = async (bankData) => {
    const res = await bankApi.createBank(bankData);
    await fetchBanks(true);
    return res;
  };

  const editBank = async (id, bankData) => {
    const res = await bankApi.updateBank(id, bankData);
    await fetchBanks(true);
    return res;
  };

  const removeBank = async (id) => {
    const res = await bankApi.deleteBank(id);
    await fetchBanks(true);
    return res;
  };

  const makePrimary = async (id) => {
    const res = await bankApi.setPrimaryBank(id);
    await fetchBanks(true);
    return res;
  };

  return {
    banks,
    loading,
    error,
    refetch: fetchBanks,
    addBank,
    editBank,
    removeBank,
    makePrimary,
  };
};

export default useBanks;
