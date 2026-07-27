import React, { useState } from 'react';
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
import { formatCurrency } from '../../utils/formatCurrency';

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
  const { splitRequest, loading, error, refetch } = useSplitDetail(splitId);
  const { updateSplit, deleteSplit } = useGroupSplitRequests(splitRequest?.group);

  const [updating, setUpdating] = useState(false);

  const paidByObj = typeof splitRequest?.paidBy === 'object' ? splitRequest.paidBy : {};
  const participants = splitRequest?.participants || [];
  const isCompleted = splitRequest?.status === 'completed';

  const toggleParticipantStatus = async (participant) => {
    const pUserId = typeof participant.user === 'object' ? participant.user._id || participant.user.id : participant.user;
    const currentStatus = participant.status || 'pending';
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';

    const updatedParticipants = participants.map((p) => {
      const id = typeof p.user === 'object' ? p.user._id || p.user.id : p.user;
      if (id === pUserId) {
        return { ...p, user: id, status: newStatus };
      }
      return { ...p, user: typeof p.user === 'object' ? p.user._id || p.user.id : p.user };
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
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
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
              Alert.alert('Success', 'Split expense deleted');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const renderParticipantItem = ({ item }) => {
    const userObj = typeof item.user === 'object' ? item.user : { fullName: 'Participant' };
    const isPaid = item.status === 'paid';

    return (
      <View style={styles.participantCard}>
        <AvatarCircle name={userObj.fullName} avatar={userObj.avatar} size={42} />
        
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{userObj.fullName || 'User'}</Text>
          <Text style={styles.participantAmount}>{formatCurrency(item.amount || 0)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : styles.statusBadgePending]}
          onPress={() => toggleParticipantStatus(item)}
          disabled={updating}
          activeOpacity={0.8}
        >
          <Icon
            name={isPaid ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={isPaid ? colors.success : colors.warning}
          />
          <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
            {isPaid ? 'Paid' : 'Pending'}
          </Text>
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
          {splitRequest?.title || routeTitle || 'Split Details'}
        </Text>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
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
                <Text style={styles.totalLabel}>Total Expense</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(splitRequest?.totalAmount || splitRequest?.amount || 0)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Paid By</Text>
                  <View style={styles.payerInfoRow}>
                    <AvatarCircle name={paidByObj.fullName} avatar={paidByObj.avatar} size={24} />
                    <Text style={styles.payerName}>{paidByObj.fullName || 'Member'}</Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Split Method</Text>
                  <Text style={styles.metaValue}>
                    {(splitRequest?.splitType || 'equal').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <View
                    style={[
                      styles.overallBadge,
                      isCompleted ? styles.overallBadgeCompleted : styles.overallBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.overallBadgeText,
                        isCompleted ? styles.overallBadgeTextCompleted : styles.overallBadgeTextPending,
                      ]}
                    >
                      {isCompleted ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeaderTitle}>Participant Breakdown</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.danger + '15',
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
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl || 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.sizes?.xs || 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
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
    marginBottom: spacing.md,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  payerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payerName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  overallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  overallBadgeCompleted: {
    backgroundColor: colors.success + '20',
  },
  overallBadgePending: {
    backgroundColor: colors.warning + '20',
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
  sectionHeaderTitle: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  participantCard: {
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
  participantInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  participantName: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  participantAmount: {
    fontSize: typography.sizes?.xs || 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  statusBadgePaid: {
    backgroundColor: colors.success + '18',
  },
  statusBadgePending: {
    backgroundColor: colors.warning + '18',
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
});

export default SplitRequestDetailScreen;
