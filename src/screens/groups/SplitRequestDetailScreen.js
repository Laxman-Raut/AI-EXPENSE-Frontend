import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useSplitDetail, useGroupSplitRequests } from '../../hooks/useSplitRequests';
import { useGroupDetails } from '../../hooks/useGroups';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
import upiService from '../../services/upiService';
import PaymentBottomSheet from '../../components/PaymentBottomSheet';
import Snackbar from '../../components/Snackbar';



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

const SplitRequestDetailScreen = ({ route, navigation }) => {
  const { splitId, title: routeTitle } = route.params || {};
  const { user } = useAuth();
  const currentUserId = String(user?._id || user?.id || '');

  const { splitRequest, loading, error, refetch } = useSplitDetail(splitId);
  const { updateSplit, deleteSplit } = useGroupSplitRequests(splitRequest?.group);
  const { group } = useGroupDetails(splitRequest?.group);

  // ─── Real-Time Focus Sync & Auto-Polling (3s) ────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refetch();

      const interval = setInterval(() => {
        refetch();
      }, 3000);

      return () => clearInterval(interval);
    }, [refetch])
  );

  const [updating, setUpdating] = useState(false);

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

  const paidByObj = typeof splitRequest?.paidBy === 'object' ? splitRequest.paidBy : {};
  const participants = splitRequest?.participants || [];
  const isCompleted = splitRequest?.status === 'completed';

  // Authorization checks
  const groupAdminId = String(group?.createdBy?._id || group?.createdBy || '');
  const splitPayerId = String(paidByObj._id || paidByObj.id || splitRequest?.paidBy || '');

  const isGroupAdmin = Boolean(groupAdminId && groupAdminId === currentUserId);
  const isSplitCreator = Boolean(splitPayerId && splitPayerId === currentUserId);
  const canDeleteSplit = isGroupAdmin || isSplitCreator;
  const canToggleStatus = isSplitCreator;

  // Find current user's participant object
  const myParticipant = participants.find((p) => {
    const pId = String(typeof p.user === 'object' ? p.user._id || p.user.id : p.user);
    return pId === currentUserId;
  });

  // UPI Deep Link Generation & Pay Flow
  const handleUpiPayNow = async (idToPay = splitId) => {
    setPaymentLoading(true);
    try {
      const res = await upiService.generateDeepLink(idToPay);
      if (res && res.success && res.data) {
        setPaymentData({
          ...res.data,
          note: splitRequest?.title || 'Split Expense',
        });
        setUpiModalVisible(true);
      } else {
        showSnackbar(res?.message || 'Failed to generate UPI payment link.', 'error');
      }
    } catch (err) {
      console.log('[UPI Flow Error]', err);
      const errMsg = err?.message || 'Failed to generate UPI payment link.';
      const isNetErr = err?.isNetworkError || !err?.response;

      if (isNetErr) {
        showSnackbar(
          'Network connection failed. Please check your internet connection.',
          'error',
          'Retry',
          () => handleUpiPayNow(idToPay)
        );
      } else {
        showSnackbar(errMsg, 'error');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const toggleParticipantStatus = async (participant) => {
    const pUserId = String(typeof participant.user === 'object' ? participant.user._id || participant.user.id : participant.user);
    const isMe = pUserId === currentUserId;

    // If regular member tapping themselves, trigger UPI payment if pending
    if (!isPaidStatus(participant.status) && isMe && !canToggleStatus) {
      handleUpiPayNow(splitId);
      return;
    }

    // Strict validation check: only creator of this expense can mark other members as paid
    if (!canToggleStatus && !isMe) {
      showSnackbar('Only the creator of this split expense can mark members as paid.', 'warning');
      return;
    }

    const currentStatus = participant.status || 'pending';
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';

    const updatedParticipants = participants.map((p) => {
      const id = String(typeof p.user === 'object' ? p.user._id || p.user.id : p.user);
      if (id === pUserId) {
        return { ...p, user: id, status: newStatus };
      }
      return { ...p, user: id };
    });

    const allPaid = updatedParticipants.every((p) => p.status === 'paid');

    setUpdating(true);
    try {
      await updateSplit(splitId, {
        participants: updatedParticipants,
        status: allPaid ? 'completed' : 'pending',
      });
      refetch();
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const isPaidStatus = (status) => status === 'paid';

  const handleDelete = () => {
    if (!canDeleteSplit) {
      showSnackbar('Only the creator of this expense or group admin can delete it.', 'warning');
      return;
    }

    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this split expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplit(splitId);
              showSnackbar('Split expense deleted', 'success');
              navigation.goBack();
            } catch (err) {
              showSnackbar(err?.response?.data?.message || 'Failed to delete expense', 'error');
            }
          },
        },
      ]
    );
  };

  const renderParticipantItem = ({ item }) => {
    const userObj = typeof item.user === 'object' ? item.user : { fullName: 'Participant' };
    const pUserId = String(userObj._id || userObj.id || item.user);
    const isPaid = item.status === 'paid';
    const isMe = pUserId === currentUserId;
    const canTap = canToggleStatus || isMe;
    const isItemAdmin = pUserId === groupAdminId;

    return (
      <View style={styles.participantCard}>
        <AvatarCircle name={userObj.fullName} avatar={userObj.avatar} size={44} />
        
        <View style={styles.participantInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.participantName}>
              {isMe ? 'You' : userObj.fullName || 'User'}
            </Text>
            {isItemAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Group Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.participantAmount}>{formatCurrency(item.amount || 0)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.statusBadge,
            isPaid ? styles.statusBadgePaid : styles.statusBadgePending,
            !canTap && styles.statusBadgeDisabled,
          ]}
          onPress={() => {
            if (!isPaid && isMe) {
              handleUpiPayNow(splitId);
            } else {
              toggleParticipantStatus(item);
            }
          }}
          disabled={updating || paymentLoading}
          activeOpacity={0.8}
        >
          <Icon
            name={isPaid ? 'checkmark-done' : canTap ? 'card-outline' : 'lock-closed-outline'}
            size={14}
            color={isPaid ? colors.success : canTap ? colors.warning : colors.text.muted}
          />
          <Text
            style={[
              styles.statusText,
              isPaid ? styles.statusTextPaid : canTap ? styles.statusTextPending : styles.statusTextDisabled,
            ]}
          >
            {isPaid ? 'Paid' : isMe ? 'Pay Now' : 'Pending'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header - Dark Theme */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {splitRequest?.title || routeTitle || 'Split Details'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {group?.name ? `Group: ${group.name}` : 'Expense Breakdown'}
          </Text>
        </View>

        {canDeleteSplit ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Icon name="trash-outline" size={20} color="#ff6b6b" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading expense details...</Text>
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
          data={participants}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderParticipantItem}
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
            <View style={styles.summaryCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL EXPENSE AMOUNT</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(splitRequest?.totalAmount || splitRequest?.amount || 0)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>PAID BY</Text>
                  <View style={styles.payerInfoRow}>
                    <AvatarCircle name={paidByObj.fullName} avatar={paidByObj.avatar} size={22} />
                    <Text style={styles.payerName}>
                      {String(paidByObj._id || paidByObj.id) === currentUserId ? 'You' : paidByObj.fullName || 'Member'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>SPLIT METHOD</Text>
                  <Text style={styles.metaValue}>
                    {(splitRequest?.splitType || 'equal').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>STATUS</Text>
                  <View
                    style={[
                      styles.overallBadge,
                      isCompleted ? styles.overallBadgeCompleted : styles.overallBadgePending,
                    ]}
                  >
                    <Icon
                      name={isCompleted ? 'checkmark-done' : 'time-outline'}
                      size={12}
                      color={isCompleted ? colors.success : colors.warning}
                    />
                    <Text
                      style={[
                        styles.overallBadgeText,
                        isCompleted ? styles.overallBadgeTextCompleted : styles.overallBadgeTextPending,
                      ]}
                    >
                      {isCompleted ? 'Settled' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Prominent Pay Now Button for User's Share */}
              {!isCompleted && myParticipant && myParticipant.status !== 'paid' && (
                <TouchableOpacity
                  style={styles.payNowPrimaryBtn}
                  onPress={() => handleUpiPayNow(splitId)}
                  disabled={paymentLoading}
                  activeOpacity={0.85}
                >
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="card-outline" size={18} color="#fff" />
                      <Text style={styles.payNowPrimaryBtnText}>
                        Pay Now with UPI ({formatCurrency(myParticipant.amount)})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!isSplitCreator && (
                <View style={styles.infoBanner}>
                  <Icon name="information-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.infoBannerText}>
                    Only the creator of this expense can mark members as paid. Tap "Pay Now" to settle your share via Google Pay, PhonePe, or Paytm.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionHeaderTitle}>Participant Breakdown</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

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
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,107,107,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl || 40,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  payerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  overallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  overallBadgeCompleted: {
    backgroundColor: colors.success + '1A',
  },
  overallBadgePending: {
    backgroundColor: colors.warning + '1A',
  },
  overallBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overallBadgeTextCompleted: {
    color: colors.success,
  },
  overallBadgeTextPending: {
    color: colors.warning,
  },
  payNowPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  payNowPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
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
  participantInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  adminBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  participantAmount: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    gap: 4,
  },
  statusBadgePaid: {
    backgroundColor: colors.success + '1F',
  },
  statusBadgePending: {
    backgroundColor: colors.warning + '1F',
  },
  statusBadgeDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextPaid: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  statusTextDisabled: {
    color: colors.text.muted,
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
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SplitRequestDetailScreen;
