import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const {
    data: groups = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await getGroups();
      return res.data || [];
    },
  });

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const createMutation = useMutation({
    mutationFn: (groupData) => createGroup(groupData),
    onSuccess: () => invalidateGroups(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ groupId, updateData }) => updateGroup(groupId, updateData),
    onSuccess: (_, variables) => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['groupDetails', variables.groupId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId) => deleteGroup(groupId),
    onSuccess: () => invalidateGroups(),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }) => addMember(groupId, memberId),
    onSuccess: (_, variables) => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['groupDetails', variables.groupId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }) => removeMember(groupId, memberId),
    onSuccess: (_, variables) => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['groupDetails', variables.groupId] });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId) => leaveGroup(groupId),
    onSuccess: () => invalidateGroups(),
  });

  return {
    groups,
    loading,
    error: error?.message || null,
    refetch,
    createGroup: async (groupData) => {
      const res = await createMutation.mutateAsync(groupData);
      return res.data;
    },
    updateGroup: async (groupId, updateData) => {
      const res = await updateMutation.mutateAsync({ groupId, updateData });
      return res.data;
    },
    deleteGroup: (groupId) => deleteMutation.mutateAsync(groupId),
    addMember: async (groupId, memberId) => {
      const res = await addMemberMutation.mutateAsync({ groupId, memberId });
      return res.data;
    },
    removeMember: async (groupId, memberId) => {
      const res = await removeMemberMutation.mutateAsync({ groupId, memberId });
      return res.data;
    },
    leaveGroup: async (groupId) => {
      const res = await leaveGroupMutation.mutateAsync(groupId);
      return res.data;
    },
  };
};

export const useGroupDetails = (groupId) => {
  const queryClient = useQueryClient();

  const {
    data: group = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['groupDetails', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res = await getGroupById(groupId);
      return res.data || null;
    },
    enabled: !!groupId,
  });

  const setGroup = (updater) => {
    queryClient.setQueryData(['groupDetails', groupId], updater);
  };

  return {
    group,
    loading,
    error: error?.message || null,
    refetch,
    setGroup,
  };
};
