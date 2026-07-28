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
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import upiService from '../../services/upiService';
import PaymentBottomSheet from '../../components/PaymentBottomSheet';
import Snackbar from '../../components/Snackbar';
import dayjs from 'dayjs';

const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_DARK_GREEN = '#128C7E';
const WHATSAPP_HEADER_GREEN = '#075E54';

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'G';

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
      colors={[WHATSAPP_DARK_GREEN, WHATSAPP_HEADER_GREEN]}
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

  const { user } = useAuth();
  const currentUserId = String(user?._id || user?.id || '');

  const { group, loading, error, refetch: refetchGroup } = useGroupDetails(groupId);
  const { addMember, removeMember, leaveGroup, deleteGroup } = useGroups();
  const { friends } = useFriends();

  const createdBy = group?.createdBy || {};
  const createdById = String(typeof createdBy === 'object' ? createdBy._id || createdBy.id : createdBy || '');
  const members = group?.members || [];

  const isGroupAdmin = Boolean(createdById && createdById === currentUserId);

  const {
    splitRequests,
    loading: splitsLoading,
    refetch: refetchSplits,
    balanceSummary,
    updateSplit,
  } = useGroupSplitRequests(groupId, currentUserId);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // UPI Payment states
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'error',
    actionText: null,
    onAction: null,
  });

  const showSnackbar = (message, type = 'error', actionText = null, onAction = null) => {
    setSnackbar({
      visible: true,
      message,
      type,
      actionText,
      onAction,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  const handleRefresh = () => {
    refetchGroup();
    refetchSplits();
  };

  const isMemberAlready = (friendUserId) => {
    return members.some((m) => {
      const mId = String(typeof m === 'object' ? m._id || m.id : m);
      return mId === String(friendUserId);
    });
  };

  const handleAddMember = async (friendId) => {
    if (!isGroupAdmin) {
      showSnackbar('Only group admin can add members.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await addMember(groupId, friendId);
      showSnackbar('Member added to group', 'success');
      setAddModalVisible(false);
      handleRefresh();
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to add member', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = (member) => {
    if (!isGroupAdmin) {
      showSnackbar('Only group admin can remove members.', 'warning');
      return;
    }
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
              showSnackbar('Member removed', 'success');
              handleRefresh();
            } catch (err) {
              showSnackbar(err?.response?.data?.message || 'Failed to remove member', 'error');
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
              showSnackbar('You left the group', 'info');
              navigation.goBack();
            } catch (err) {
              showSnackbar(err?.response?.data?.message || 'Failed to leave group', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!isGroupAdmin) {
      showSnackbar('Only group creator/admin can delete this group.', 'warning');
      return;
    }

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
              showSnackbar('Group deleted', 'success');
              navigation.goBack();
            } catch (err) {
              showSnackbar(err?.response?.data?.message || 'Failed to delete group', 'error');
            }
          },
        },
      ]
    );
  };

  // UPI Deep Link Generation & Pay Flow for Quick Pay
  const handleUpiPayNow = async (splitRequestId) => {
    setPaymentLoading(true);
    try {
      const res = await upiService.generateDeepLink(splitRequestId);
      if (res && res.success && res.data) {
        setPaymentData(res.data);
        setUpiModalVisible(true);
      } else {
        showSnackbar(res?.message || 'Failed to generate UPI payment link.', 'error');
      }
    } catch (err) {
      console.log('[UPI Quick Pay Error]', err);
      const errMsg = err?.message || 'Failed to generate UPI payment link.';
      const isNetErr = err?.isNetworkError || !err?.response;

      if (isNetErr) {
        showSnackbar(
          'Network connection failed. Please check your internet connection.',
          'error',
          'Retry',
          () => handleUpiPayNow(splitRequestId)
        );
      } else {
        showSnackbar(errMsg, 'error');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleQuickPay = async (item) => {
    const myParticipant = item.participants?.find((p) => {
      const pId = String(typeof p.user === 'object' ? p.user._id || p.user.id : p.user);
      return pId === currentUserId;
    });

    if (!myParticipant) {
      navigation.navigate('SplitRequestDetail', { splitId: item._id, title: item.title });
      return;
    }

    if (myParticipant.status === 'paid') {
      showSnackbar('You have already paid your share for this expense.', 'info');
      return;
    }

    // Trigger UPI Deep Link & Payment App Selection Sheet
    handleUpiPayNow(item._id);
  };

  const renderMemberItem = ({ item }) => {
    const memberObj = typeof item === 'object' ? item : { _id: item, fullName: 'User' };
    const memberId = String(memberObj._id || memberObj.id || '');
    const isOwner = memberId === createdById;
    const isMe = memberId === currentUserId;

    return (
      <View style={styles.memberCard}>
        <AvatarCircle name={memberObj.fullName} avatar={memberObj.avatar} size={46} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {memberObj.fullName || 'Member'} {isMe ? '(You)' : ''}
          </Text>
          <Text style={styles.memberSub}>
            {memberObj.username ? `@${memberObj.username}` : memberObj.email || 'Group Participant'}
          </Text>
        </View>

        {isOwner ? (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Group Admin</Text>
          </View>
        ) : isGroupAdmin && !isMe ? (
          <TouchableOpacity
            style={styles.removeMemberBtn}
            onPress={() => handleRemoveMember(memberObj)}
          >
            <Icon name="person-remove-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderGooglePaySplitItem = ({ item }) => {
    const paidByObj = typeof item.paidBy === 'object' ? item.paidBy : {};
    const isCompleted = item.status === 'completed';
    const total = Number(item.totalAmount || item.amount || 0);

    const dueDate = item.dueDate ? dayjs(item.dueDate) : dayjs().add(7, 'day');
    const isOverdue = !isCompleted && dayjs().isAfter(dueDate);
    const dueText = isCompleted
      ? 'Settled'
      : isOverdue
      ? 'Overdue'
      : `Due ${dueDate.format('MMM D')}`;

    // Check if current user is participant and paid
    const myParticipant = item.participants?.find((p) => {
      const pId = String(typeof p.user === 'object' ? p.user._id || p.user.id : p.user);
      return pId === currentUserId;
    });
    const iHavePaid = myParticipant?.status === 'paid';

    return (
      <TouchableOpacity
        style={styles.splitCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('SplitRequestDetail', { splitId: item._id, title: item.title })}
      >
        <View style={styles.splitHeader}>
          <AvatarCircle name={paidByObj.fullName || 'User'} avatar={paidByObj.avatar} size={40} />

          <View style={styles.splitTitleBox}>
            <Text style={styles.splitTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.splitSubText}>
              Paid by <Text style={styles.payerBold}>{String(paidByObj._id || paidByObj.id) === currentUserId ? 'You' : paidByObj.fullName || 'Member'}</Text>
            </Text>
          </View>

          <View style={styles.splitAmountBox}>
            <Text style={styles.splitAmount}>{formatCurrency(total)}</Text>
            <Text style={styles.splitTypeBadge}>{(item.splitType || 'equal').toUpperCase()}</Text>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.splitFooter}>
          <View style={[styles.dueBadge, isCompleted ? styles.dueBadgeSettled : isOverdue ? styles.dueBadgeOverdue : styles.dueBadgePending]}>
            <Icon
              name={isCompleted ? 'checkmark-done' : isOverdue ? 'alert-circle' : 'time-outline'}
              size={14}
              color={isCompleted ? WHATSAPP_GREEN : isOverdue ? colors.danger : colors.warning}
            />
            <Text style={[styles.dueBadgeText, isCompleted ? styles.dueBadgeTextSettled : isOverdue ? styles.dueBadgeTextOverdue : styles.dueBadgeTextPending]}>
              {dueText}
            </Text>
          </View>

          {!isCompleted && myParticipant && !iHavePaid && (
            <TouchableOpacity
              style={styles.payShareBtn}
              onPress={() => handleQuickPay(item)}
              disabled={paymentLoading}
              activeOpacity={0.8}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payShareBtnText}>Pay Share ({formatCurrency(myParticipant.amount)})</Text>
              )}
            </TouchableOpacity>
          )}

          {iHavePaid && !isCompleted && (
            <View style={styles.paidSelfBadge}>
              <Icon name="checkmark-circle" size={14} color={WHATSAPP_GREEN} />
              <Text style={styles.paidSelfText}>You Paid</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* WhatsApp Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || groupName || 'Group Details'}
          </Text>
          <Text style={styles.headerSub}>
            {members.length} participant{members.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => {
            const options = [];
            if (isGroupAdmin) {
              options.push({
                text: 'Edit Group Details',
                onPress: () =>
                  navigation.navigate('CreateEditGroup', {
                    isEditing: true,
                    group,
                  }),
              });
            }
            options.push({
              text: 'Leave Group',
              style: 'destructive',
              onPress: handleLeave,
            });
            if (isGroupAdmin) {
              options.push({
                text: 'Delete Group',
                style: 'destructive',
                onPress: handleDelete,
              });
            }
            options.push({ text: 'Cancel', style: 'cancel' });

            Alert.alert('Group Options', 'Select an action', options);
          }}
        >
          <Icon name="ellipsis-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={WHATSAPP_GREEN} size="large" />
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
              tintColor={WHATSAPP_GREEN}
            />
          }
          ListHeaderComponent={
            <View>
              {/* WhatsApp Profile Hero Section */}
              <View style={styles.heroSection}>
                <View style={styles.heroAvatarContainer}>
                  <AvatarCircle name={group?.name} avatar={group?.avatar} size={76} />
                </View>
                
                <Text style={styles.heroTitle}>{group?.name}</Text>
                <Text style={styles.heroMeta}>
                  Group · {members.length} participants
                </Text>
                {group?.description ? (
                  <Text style={styles.heroDesc}>{group.description}</Text>
                ) : null}

                {/* WhatsApp Circular Quick Actions Bar */}
                <View style={styles.quickActionsRow}>
                  {isGroupAdmin && (
                    <TouchableOpacity
                      style={styles.actionCircleBtn}
                      onPress={() => setAddModalVisible(true)}
                    >
                      <View style={[styles.actionCircleIcon, { backgroundColor: WHATSAPP_GREEN }]}>
                        <Icon name="person-add" size={20} color="#fff" />
                      </View>
                      <Text style={styles.actionCircleLabel}>Add</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionCircleBtn}
                    onPress={() => navigation.navigate('CreateSplitRequest', { group })}
                  >
                    <View style={[styles.actionCircleIcon, { backgroundColor: WHATSAPP_DARK_GREEN }]}>
                      <Icon name="add" size={22} color="#fff" />
                    </View>
                    <Text style={styles.actionCircleLabel}>Split Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCircleBtn}
                    onPress={() => setActiveTab(activeTab === 'Members' ? 'Splits' : 'Members')}
                  >
                    <View style={[styles.actionCircleIcon, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                      <Icon name={activeTab === 'Members' ? 'receipt-outline' : 'people-outline'} size={20} color={WHATSAPP_DARK_GREEN} />
                    </View>
                    <Text style={styles.actionCircleLabel}>{activeTab === 'Members' ? 'Expenses' : 'Members'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Balance Cards Summary */}
                <View style={styles.balanceRow}>
                  <View style={styles.balanceCard}>
                    <Icon name="arrow-down-circle" size={18} color={WHATSAPP_GREEN} />
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

              {/* WhatsApp Style Tab Navigation Bar */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'Splits' && styles.tabItemActive]}
                  onPress={() => setActiveTab('Splits')}
                >
                  <Icon
                    name="chatbubbles-outline"
                    size={16}
                    color={activeTab === 'Splits' ? WHATSAPP_DARK_GREEN : colors.text.secondary}
                  />
                  <Text style={[styles.tabText, activeTab === 'Splits' && styles.tabTextActive]}>
                    ACTIVITY ({splitRequests.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'Members' && styles.tabItemActive]}
                  onPress={() => setActiveTab('Members')}
                >
                  <Icon
                    name="people-outline"
                    size={16}
                    color={activeTab === 'Members' ? WHATSAPP_DARK_GREEN : colors.text.secondary}
                  />
                  <Text style={[styles.tabText, activeTab === 'Members' && styles.tabTextActive]}>
                    PARTICIPANTS ({members.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* WhatsApp "Add participants" row if on Members tab & user is admin */}
              {activeTab === 'Members' && isGroupAdmin && (
                <TouchableOpacity
                  style={styles.addParticipantRow}
                  onPress={() => setAddModalVisible(true)}
                >
                  <View style={styles.addParticipantCircle}>
                    <Icon name="person-add" size={18} color="#fff" />
                  </View>
                  <Text style={styles.addParticipantText}>Add participants</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Icon
                name={activeTab === 'Splits' ? 'chatbubble-ellipses-outline' : 'people-outline'}
                size={44}
                color={WHATSAPP_DARK_GREEN}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'Splits' ? 'No Split Expenses Yet' : 'No Participants'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'Splits'
                  ? 'Tap "Split Bill" to share expenses with members'
                  : 'Add friends to this group to track split expenses'}
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
              <Text style={styles.modalTitle}>Add Participants</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close-circle" size={24} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <View style={styles.emptyFriendsView}>
                <Icon name="people-outline" size={40} color={WHATSAPP_DARK_GREEN} />
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

      {/* UPI Payment App Bottom Sheet */}
      <PaymentBottomSheet
        visible={upiModalVisible}
        onClose={() => setUpiModalVisible(false)}
        paymentData={paymentData}
        loading={paymentLoading}
      />

      {/* Reusable Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        actionText={snackbar.actionText}
        onAction={snackbar.onAction}
        onDismiss={hideSnackbar}
      />
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
    backgroundColor: WHATSAPP_HEADER_GREEN,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: '#aebac1',
    marginTop: 1,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xxl || 40,
  },
  heroSection: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  heroAvatarContainer: {
    borderWidth: 3,
    borderColor: WHATSAPP_GREEN,
    borderRadius: 40,
    padding: 2,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  heroMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  actionCircleBtn: {
    alignItems: 'center',
  },
  actionCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCircleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceAmountSuccess: {
    fontSize: 16,
    fontWeight: '800',
    color: WHATSAPP_GREEN,
    marginTop: 2,
  },
  balanceAmountDanger: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: WHATSAPP_DARK_GREEN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: WHATSAPP_DARK_GREEN,
  },
  addParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  addParticipantCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHATSAPP_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  addParticipantText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHATSAPP_DARK_GREEN,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  memberSub: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: WHATSAPP_GREEN + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHATSAPP_DARK_GREEN,
  },
  removeMemberBtn: {
    padding: spacing.xs,
  },
  splitCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitTitleBox: {
    flex: 1,
    marginLeft: spacing.md,
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  splitSubText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  payerBold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  splitAmountBox: {
    alignItems: 'flex-end',
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: WHATSAPP_DARK_GREEN,
  },
  splitTypeBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.muted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  splitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dueBadgeSettled: {
    backgroundColor: WHATSAPP_GREEN + '1A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dueBadgePending: {
    backgroundColor: colors.warning + '1A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dueBadgeOverdue: {
    backgroundColor: colors.danger + '1A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dueBadgeTextSettled: {
    color: WHATSAPP_GREEN,
  },
  dueBadgeTextPending: {
    color: colors.warning,
  },
  dueBadgeTextOverdue: {
    color: colors.danger,
  },
  payShareBtn: {
    backgroundColor: WHATSAPP_DARK_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  payShareBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  paidSelfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidSelfText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHATSAPP_GREEN,
  },
  separator: {
    height: 1,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: WHATSAPP_HEADER_GREEN,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  friendSub: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  addFriendBtn: {
    backgroundColor: WHATSAPP_DARK_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addFriendBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alreadyAddedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  emptyFriendsView: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyFriendsText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default GroupDetailsScreen;
