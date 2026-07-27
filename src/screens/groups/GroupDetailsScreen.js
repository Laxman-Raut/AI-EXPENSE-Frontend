import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useGroupDetails, useGroups } from '../../hooks/useGroups';
import { useFriends } from '../../hooks/useFriends';

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'U';

const AvatarCircle = ({ name, avatar, size = 44 }) => {
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params || {};
  const { group, loading, error, refetch } = useGroupDetails(groupId);
  const { addMember, removeMember, leaveGroup, deleteGroup } = useGroups();
  const { friends } = useFriends();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const createdBy = group?.createdBy || {};
  const createdById = typeof createdBy === 'object' ? createdBy._id || createdBy.id : createdBy;
  const members = group?.members || [];

  // Helper to check if a friend is already in group
  const isMemberAlready = (friendUserId) => {
    return members.some((m) => {
      const mId = typeof m === 'object' ? m._id || m.id : m;
      return mId === friendUserId;
    });
  };

  const handleAddMember = async (friendId) => {
    setActionLoading(true);
    try {
      await addMember(groupId, friendId);
      Alert.alert('Success', 'Member added to group');
      setAddModalVisible(false);
      refetch();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = (member) => {
    const memberName = member.fullName || member.username || 'this member';
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(groupId, member._id);
              Alert.alert('Success', 'Member removed');
              refetch();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId);
              Alert.alert('Success', 'You left the group');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              Alert.alert('Success', 'Group deleted');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const memberObj = typeof item === 'object' ? item : { _id: item, fullName: 'User' };
    const isOwner = memberObj._id === createdById;

    return (
      <View style={styles.memberCard}>
        <AvatarCircle name={memberObj.fullName} avatar={memberObj.avatar} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{memberObj.fullName || 'Member'}</Text>
          <Text style={styles.memberSub}>
            {memberObj.username ? `@${memberObj.username}` : memberObj.email || ''}
          </Text>
        </View>
        
        {isOwner ? (
          <View style={styles.ownerTag}>
            <Icon name="shield-checkmark" size={12} color={colors.primary} />
            <Text style={styles.ownerTagText}>Owner</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.removeMemberBtn}
            onPress={() => handleRemoveMember(memberObj)}
          >
            <Icon name="person-remove-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name || groupName || 'Group Details'}
        </Text>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => {
            Alert.alert(
              'Group Options',
              'Select an action',
              [
                {
                  text: 'Edit Group Details',
                  onPress: () =>
                    navigation.navigate('CreateEditGroup', {
                      isEditing: true,
                      group,
                    }),
                },
                {
                  text: 'Leave Group',
                  style: 'destructive',
                  onPress: handleLeave,
                },
                {
                  text: 'Delete Group',
                  style: 'destructive',
                  onPress: handleDelete,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Icon name="ellipsis-vertical" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Icon name="cloud-offline-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderMemberItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.detailsBanner}>
              <View style={styles.bannerAvatarWrapper}>
                <AvatarCircle name={group?.name} avatar={group?.avatar} size={70} />
              </View>
              <Text style={styles.bannerTitle}>{group?.name}</Text>
              {group?.description ? (
                <Text style={styles.bannerDesc}>{group.description}</Text>
              ) : null}

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Icon name="people-outline" size={20} color={colors.primary} />
                  <Text style={styles.statNumber}>{members.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Group Members</Text>
                <TouchableOpacity
                  style={styles.addMemberBtn}
                  onPress={() => setAddModalVisible(true)}
                >
                  <Icon name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.addMemberBtnText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Add Member Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Member from Friends</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close-circle" size={24} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <View style={styles.emptyFriendsView}>
                <Icon name="people-outline" size={40} color={colors.primary} />
                <Text style={styles.emptyFriendsText}>
                  You haven't added any friends yet. Add friends first to invite them to groups!
                </Text>
              </View>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const friend = item.sender?.fullName ? item.sender : item.receiver || {};
                  const isAlreadyInGroup = isMemberAlready(friend._id);

                  return (
                    <View style={styles.friendRow}>
                      <AvatarCircle name={friend.fullName} avatar={friend.avatar} size={40} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.friendName}>{friend.fullName}</Text>
                        <Text style={styles.friendSub}>{friend.email || ''}</Text>
                      </View>

                      {isAlreadyInGroup ? (
                        <Text style={styles.alreadyAddedText}>Added</Text>
                      ) : (
                        <TouchableOpacity
                          style={styles.addFriendBtn}
                          onPress={() => handleAddMember(friend._id)}
                          disabled={actionLoading}
                        >
                          <Text style={styles.addFriendBtnText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginHorizontal: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl || 40,
  },
  detailsBanner: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl || 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerAvatarWrapper: {
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: typography.sizes?.lg || 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  bannerDesc: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg || 14,
  },
  statNumber: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: 4,
  },
  addMemberBtnText: {
    color: '#fff',
    fontSize: typography.sizes?.xs || 12,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  memberSub: {
    fontSize: typography.sizes?.xs || 12,
    color: colors.text.secondary,
  },
  ownerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  ownerTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  removeMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl || 24,
    borderTopRightRadius: radius.xl || 24,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyFriendsView: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyFriendsText: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: typography.sizes?.sm || 13,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  friendName: {
    color: colors.text.primary,
    fontSize: typography.sizes?.md || 14,
    fontWeight: '600',
  },
  friendSub: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  addFriendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  addFriendBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alreadyAddedText: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GroupDetailsScreen;
