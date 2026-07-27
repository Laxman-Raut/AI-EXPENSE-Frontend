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
import { useGroupSplitRequests } from '../../hooks/useSplitRequests';
import { formatCurrency } from '../../utils/formatCurrency';
import dayjs from 'dayjs';

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
  const [activeTab, setActiveTab] = useState('Splits'); // 'Splits' or 'Members'

  const { group, loading, error, refetch: refetchGroup } = useGroupDetails(groupId);
  const { addMember, removeMember, leaveGroup, deleteGroup } = useGroups();
  const { friends } = useFriends();

  const createdBy = group?.createdBy || {};
  const createdById = typeof createdBy === 'object' ? createdBy._id || createdBy.id : createdBy;
  const members = group?.members || [];

  const {
    splitRequests,
    loading: splitsLoading,
    refetch: refetchSplits,
    balanceSummary,
    updateSplit,
  } = useGroupSplitRequests(groupId, createdById);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRefresh = () => {
    refetchGroup();
    refetchSplits();
  };

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
      handleRefresh();
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
              handleRefresh();
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

  const handleQuickPay = async (item) => {
    // Quick pay my share for this split request
    const myParticipant = item.participants?.find((p) => {
      const pId = typeof p.user === 'object' ? p.user._id || p.user.id : p.user;
      return String(pId) === String(createdById);
    });

    if (!myParticipant) {
      navigation.navigate('SplitRequestDetail', { splitId: item._id, title: item.title });
      return;
    }

    if (myParticipant.status === 'paid') {
      Alert.alert('Info', 'You have already paid your share for this split expense.');
      return;
    }

    Alert.alert(
      'Pay Share (Google Pay style)',
      `Pay ${formatCurrency(myParticipant.amount)} for "${item.title}"? Income & Expense transactions will be recorded automatically!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              const updatedParticipants = item.participants.map((p) => {
                const pId = typeof p.user === 'object' ? p.user._id || p.user.id : p.user;
                const isMe = String(pId) === String(createdById);
                return {
                  user: pId,
                  amount: p.amount,
                  status: isMe ? 'paid' : p.status,
                };
              });

              const allPaid = updatedParticipants.every((p) => p.status === 'paid');
              await updateSplit(item._id, {
                participants: updatedParticipants,
                status: allPaid ? 'completed' : 'pending',
              });
              Alert.alert('Payment Successful', 'Your payment was processed & recorded in your transactions!');
              handleRefresh();
            } catch (err) {
              Alert.alert('Error', 'Failed to record payment');
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

  const renderGooglePaySplitItem = ({ item }) => {
    const paidByObj = typeof item.paidBy === 'object' ? item.paidBy : {};
    const isCompleted = item.status === 'completed';
    const total = Number(item.totalAmount || item.amount || 0);

    // Calculate due date status
    const dueDate = item.dueDate ? dayjs(item.dueDate) : dayjs().add(7, 'day');
    const isOverdue = !isCompleted && dayjs().isAfter(dueDate);
    const dueText = isCompleted
      ? 'Settled'
      : isOverdue
      ? 'Overdue (Auto-Expense)'
      : `Due ${dueDate.format('MMM D')}`;

    return (
      <View style={styles.timelineRow}>
        {/* Timeline connector dot */}
        <View style={styles.timelineDotContainer}>
          <View style={[styles.timelineDot, isCompleted ? styles.timelineDotSuccess : isOverdue ? styles.timelineDotDanger : styles.timelineDotPrimary]} />
          <View style={styles.timelineLine} />
        </View>

        {/* Google Pay Style Card */}
        <TouchableOpacity
          style={styles.gpayCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SplitRequestDetail', { splitId: item._id, title: item.title })}
        >
          <View style={styles.gpayCardHeader}>
            <AvatarCircle name={paidByObj.fullName || 'User'} avatar={paidByObj.avatar} size={38} />

            <View style={styles.gpayCardTitleBox}>
              <Text style={styles.gpayTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.gpayPayerText}>
                Requested by <Text style={{ fontWeight: '700', color: colors.text.primary }}>{paidByObj.fullName || 'Member'}</Text>
              </Text>
            </View>

            <View style={styles.gpayAmountBox}>
              <Text style={styles.gpayAmount}>{formatCurrency(total)}</Text>
              <Text style={styles.gpayMethodTag}>{(item.splitType || 'equal').toUpperCase()}</Text>
            </View>
          </View>

          {/* Due date & status footer */}
          <View style={styles.gpayCardFooter}>
            <View style={[styles.dueBadge, isOverdue ? styles.dueBadgeOverdue : isCompleted ? styles.dueBadgeSettled : styles.dueBadgePending]}>
              <Icon
                name={isCompleted ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time-outline'}
                size={12}
                color={isCompleted ? colors.success : isOverdue ? colors.danger : colors.warning}
              />
              <Text style={[styles.dueBadgeText, isCompleted ? styles.dueBadgeTextSettled : isOverdue ? styles.dueBadgeTextOverdue : styles.dueBadgeTextPending]}>
                {dueText}
              </Text>
            </View>

            {!isCompleted && (
              <TouchableOpacity
                style={styles.gpayPayBtn}
                onPress={() => handleQuickPay(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.gpayPayBtnText}>Pay Share</Text>
                <Icon name="chevron-forward" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'Members' ? members : splitRequests}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={activeTab === 'Members' ? renderMemberItem : renderGooglePaySplitItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading || splitsLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Group Banner */}
              <View style={styles.detailsBanner}>
                <AvatarCircle name={group?.name} avatar={group?.avatar} size={64} />
                <Text style={styles.bannerTitle}>{group?.name}</Text>
                {group?.description ? (
                  <Text style={styles.bannerDesc}>{group.description}</Text>
                ) : null}

                {/* Balance Cards Summary */}
                <View style={styles.balanceRow}>
                  <View style={styles.balanceCard}>
                    <Icon name="arrow-down-circle" size={18} color={colors.success} />
                    <Text style={styles.balanceAmountSuccess}>{formatCurrency(balanceSummary.owedToMe)}</Text>
                    <Text style={styles.balanceLabel}>Owed to You</Text>
                  </View>
                  <View style={styles.balanceCard}>
                    <Icon name="arrow-up-circle" size={18} color={colors.danger} />
                    <Text style={styles.balanceAmountDanger}>{formatCurrency(balanceSummary.iOwe)}</Text>
                    <Text style={styles.balanceLabel}>You Owe</Text>
                  </View>
                </View>
              </View>

              {/* Sub Tabs */}
              <View style={styles.tabToggleRow}>
                <TouchableOpacity
                  style={[styles.tabToggle, activeTab === 'Splits' && styles.tabToggleActive]}
                  onPress={() => setActiveTab('Splits')}
                >
                  <Icon
                    name="receipt-outline"
                    size={16}
                    color={activeTab === 'Splits' ? '#fff' : colors.text.secondary}
                  />
                  <Text style={[styles.tabToggleText, activeTab === 'Splits' && styles.tabToggleTextActive]}>
                    Activity Feed ({splitRequests.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabToggle, activeTab === 'Members' && styles.tabToggleActive]}
                  onPress={() => setActiveTab('Members')}
                >
                  <Icon
                    name="people-outline"
                    size={16}
                    color={activeTab === 'Members' ? '#fff' : colors.text.secondary}
                  />
                  <Text style={[styles.tabToggleText, activeTab === 'Members' && styles.tabToggleTextActive]}>
                    Members ({members.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                {activeTab === 'Splits' ? (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => navigation.navigate('CreateSplitRequest', { group })}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
                      style={styles.actionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="add" size={18} color="#fff" />
                      <Text style={styles.actionText}>Split a Bill (Google Pay style)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => setAddModalVisible(true)}
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
                      style={styles.actionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="person-add" size={16} color="#fff" />
                      <Text style={styles.actionText}>Add Member</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Icon
                name={activeTab === 'Splits' ? 'receipt-outline' : 'people-outline'}
                size={40}
                color={colors.primary}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'Splits' ? 'No Split Expenses Yet' : 'No Members'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'Splits'
                  ? 'Tap "Split a Bill" to divide expenses with automatic transaction tracking'
                  : 'Add friends to this group to start splitting bills'}
              </Text>
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerTitle: {
    fontSize: typography.sizes?.lg || 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  bannerDesc: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.md,
  },
  balanceCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceAmountSuccess: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '800',
    color: colors.success,
    marginTop: 2,
  },
  balanceAmountDanger: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabToggle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md || 10,
    gap: 6,
  },
  tabToggleActive: {
    backgroundColor: colors.primary,
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabToggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  actionRow: {
    marginBottom: spacing.md,
  },
  primaryActionBtn: {
    borderRadius: radius.lg || 14,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: typography.sizes?.sm || 14,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineDotPrimary: {
    backgroundColor: colors.primary,
  },
  timelineDotSuccess: {
    backgroundColor: colors.success,
  },
  timelineDotDanger: {
    backgroundColor: colors.danger,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  gpayCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg || 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpayCardTitleBox: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gpayTitle: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  gpayPayerText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  gpayAmountBox: {
    alignItems: 'flex-end',
  },
  gpayAmount: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '800',
    color: colors.primary,
  },
  gpayMethodTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
    marginTop: 2,
  },
  gpayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  dueBadgePending: {
    backgroundColor: colors.warning + '18',
  },
  dueBadgeSettled: {
    backgroundColor: colors.success + '18',
  },
  dueBadgeOverdue: {
    backgroundColor: colors.danger + '18',
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dueBadgeTextPending: {
    color: colors.warning,
  },
  dueBadgeTextSettled: {
    color: colors.success,
  },
  dueBadgeTextOverdue: {
    color: colors.danger,
  },
  gpayPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 2,
  },
  gpayPayBtnText: {
    color: '#fff',
    fontSize: 11,
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
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 240,
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
