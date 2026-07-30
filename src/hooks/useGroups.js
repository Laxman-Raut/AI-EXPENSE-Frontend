import { useState, useEffect, useCallback } from 'react';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
} from '../api/groups';

export const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await getGroups();
      setGroups(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateGroup = async (groupData) => {
    const res = await createGroup(groupData);
    await fetchAll(true);
    return res.data;
  };

  const handleUpdateGroup = async (groupId, updateData) => {
    const res = await updateGroup(groupId, updateData);
    await fetchAll(true);
    return res.data;
  };

  const handleDeleteGroup = async (groupId) => {
    await deleteGroup(groupId);
    await fetchAll(true);
  };

  const handleAddMember = async (groupId, memberId) => {
    const res = await addMember(groupId, memberId);
    await fetchAll(true);
    return res.data;
  };

  const handleRemoveMember = async (groupId, memberId) => {
    const res = await removeMember(groupId, memberId);
    await fetchAll(true);
    return res.data;
  };

  const handleLeaveGroup = async (groupId) => {
    const res = await leaveGroup(groupId);
    await fetchAll(true);
    return res.data;
  };

  return {
    groups,
    loading,
    error,
    refetch: fetchAll,
    createGroup: handleCreateGroup,
    updateGroup: handleUpdateGroup,
    deleteGroup: handleDeleteGroup,
    addMember: handleAddMember,
    removeMember: handleRemoveMember,
    leaveGroup: handleLeaveGroup,
  };
};

export const useGroupDetails = (groupId) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async (isSilent = false) => {
    if (!groupId) return;
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await getGroupById(groupId);
      setGroup(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    group,
    loading,
    error,
    refetch: fetchDetails,
    setGroup,
  };
};
