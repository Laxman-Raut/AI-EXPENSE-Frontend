import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency, getStoredAmountForCurrency } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';
import CustomAlert from '../../components/molecules/CustomAlert';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { getGlobalCurrency } from '../../utils/formatCurrency';

const SavingsDetailsScreen = ({ route, navigation }) => {
  const { jarId } = route.params;
  const { user } = useAuth();
  const activeCurrency = user?.currency || getGlobalCurrency() || 'INR';
  const [jar, setJar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Custom Alert States
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJarDetails = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await savingsApi.getJarById(jarId);
      if (res && res.data) {
        setJar(res.data);
      }
    } catch (err) {
      console.log('[SavingsDetails] Fetch error:', err);
      setErrorMessage('Failed to load Savings Jar details');
      setErrorAlertVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJarDetails(true);
    }, [jarId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJarDetails(true);
  };

  const handleToggleArchive = async () => {
    if (!jar) return;
    const newStatus = jar.status === 'archived' ? 'active' : 'archived';
    try {
      await savingsApi.updateJar(jar._id, { status: newStatus });
      fetchJarDetails(true);
    } catch (err) {
      setErrorMessage('Failed to update jar status');
      setErrorAlertVisible(true);
    }
  };

  const handleDeleteJar = async () => {
    try {
      await savingsApi.deleteJar(jar._id);
      setDeleteAlertVisible(false);
      navigation.goBack();
    } catch (err) {
      setDeleteAlertVisible(false);
      setErrorMessage(err?.response?.data?.message || 'Failed to delete jar');
      setErrorAlertVisible(true);
    }
  };

  if (loading && !jar) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Jar Details...</Text>
      </SafeAreaView>
    );
  }

  if (!jar) return null;

  const hasTarget = jar.targetAmount && jar.targetAmount > 0;
  const currentAmount = getStoredAmountForCurrency(jar, activeCurrency, 'currentAmount');
  const targetAmount = getStoredAmountForCurrency(jar, activeCurrency, 'targetAmount');
  const percentage = hasTarget
    ? Math.min(Math.round((currentAmount / (targetAmount || 1)) * 100), 100)
    : 0;
  const remaining = hasTarget ? Math.max(targetAmount - currentAmount, 0) : 0;
  const sortedTransactions = [...(jar.transactions || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const renderTransactionItem = ({ item }) => {
    const isIncome = item.type === 'deposit' || item.type === 'transfer_in';
    return (
      <View style={styles.txCard}>
        <View
          style={[
            styles.txIconBox,
            { backgroundColor: isIncome ? colors.success + '1F' : colors.danger + '1F' },
          ]}
        >
          <Icon
            name={
              item.type === 'deposit'
                ? 'arrow-down'
                : item.type === 'withdraw'
                ? 'arrow-up'
                : 'swap-horizontal'
            }
            size={18}
            color={isIncome ? colors.success : colors.danger}
          />
        </View>

        <View style={styles.txMeta}>
          <Text style={styles.txTitle}>
            {item.type === 'deposit'
              ? 'Deposit'
              : item.type === 'withdraw'
              ? 'Withdrawal'
              : item.type === 'transfer_in'
              ? 'Transfer Received'
              : 'Transfer Sent'}
          </Text>
          <Text style={styles.txDate}>
            {dayjs(item.createdAt).format('MMM D, YYYY · h:mm A')}
          </Text>
          {item.notes ? <Text style={styles.txNotes}>{item.notes}</Text> : null}
        </View>

        <Text style={[styles.txAmount, { color: isIncome ? colors.success : colors.danger }]}>
          {isIncome ? '+' : '-'}{formatCurrency(getStoredAmountForCurrency(item, activeCurrency), activeCurrency)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {jar.name}
        </Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('CreateSavingsJar', { jar })}
          >
            <Icon name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setDeleteAlertVisible(true)}
          >
            <Icon name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedTransactions}
        keyExtractor={(item) => item._id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.topSection}>
            {/* Main Details Card */}
            <View style={[styles.mainCard, { borderColor: jar.color || colors.border }]}>
              <View style={styles.mainCardHeader}>
                <View style={[styles.iconBox, { backgroundColor: (jar.color || '#4C6EF5') + '25' }]}>
                  <Text style={styles.iconEmoji}>{jar.icon || '🏆'}</Text>
                </View>
                <View style={styles.mainCardMeta}>
                  <Text style={styles.mainJarName}>{jar.name}</Text>
                  {jar.notes ? <Text style={styles.mainJarNotes}>{jar.notes}</Text> : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (jar.color || colors.primary) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: jar.color || colors.primary }]}>
                    {jar.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Amount Display */}
              <View style={styles.amountDisplayRow}>
                <View>
                  <Text style={styles.amountDisplayLabel}>CURRENT SAVINGS</Text>
                  <Text style={styles.amountDisplayValue}>
                    {formatCurrency(currentAmount, activeCurrency)}
                  </Text>
                </View>
                {hasTarget ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountDisplayLabel}>TARGET GOAL</Text>
                    <Text style={styles.targetDisplayValue}>
                      {formatCurrency(targetAmount, activeCurrency)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Progress Indicator */}
              {hasTarget ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: jar.color || colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressMetaRow}>
                    <Text style={styles.progressMetaText}>{percentage}% Completed</Text>
                    <Text style={styles.progressMetaText}>
                      {remaining > 0 ? `${formatCurrency(remaining, activeCurrency)} Remaining` : 'Goal Reached! 🎉'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Main Action Buttons */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Deposit', { jar })}
              >
                <Icon name="arrow-down-circle" size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Add Money</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Withdraw', { jar })}
              >
                <Icon name="arrow-up-circle" size={20} color="#FFF" />
                <Text style={styles.actionBtnText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Transfer', { fromJarId: jar._id })}
              >
                <Icon name="swap-horizontal" size={20} color={colors.text.primary} />
                <Text style={[styles.actionBtnText, { color: colors.text.primary }]}>Transfer</Text>
              </TouchableOpacity>
            </View>

            {/* Archive Toggle Option */}
            <TouchableOpacity style={styles.archiveRowBtn} onPress={handleToggleArchive}>
              <Icon
                name={jar.status === 'archived' ? 'archive' : 'archive-outline'}
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.archiveRowBtnText}>
                {jar.status === 'archived' ? 'Unarchive Savings Jar' : 'Archive Savings Jar'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeaderTitle}>Transaction History</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyTxBox}>
            <Icon name="receipt-outline" size={36} color={colors.text.muted} />
            <Text style={styles.emptyTxTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyTxSub}>
              Tap "Add Money" to make your first deposit into this savings jar!
            </Text>
          </View>
        }
      />

      {/* Premium Destructive Confirmation Alert for Deleting Jar */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Savings Jar?"
        message={`Are you sure you want to delete "${jar?.name}"? All transaction logs for this jar will be permanently removed.`}
        type="destructive"
        buttons={[
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Jar', style: 'destructive' },
        ]}
        onButtonPress={(btn) => {
          if (btn.style === 'destructive') {
            handleDeleteJar();
          } else {
            setDeleteAlertVisible(false);
          }
        }}
        onCancel={() => setDeleteAlertVisible(false)}
      />

      {/* Error Alert */}
      <CustomAlert
        visible={errorAlertVisible}
        title="Error"
        message={errorMessage}
        type="destructive"
        buttons={[{ text: 'OK' }]}
        onButtonPress={() => setErrorAlertVisible(false)}
        onCancel={() => setErrorAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl || 40,
  },
  topSection: {
    paddingTop: spacing.md,
  },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconEmoji: {
    fontSize: 26,
  },
  mainCardMeta: {
    flex: 1,
  },
  mainJarName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  mainJarNotes: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  amountDisplayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  amountDisplayValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.success,
    marginTop: 2,
  },
  targetDisplayValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg || 14,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  archiveRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  archiveRowBtnText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  txDate: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  txNotes: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyTxBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  emptyTxSub: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default SavingsDetailsScreen;
