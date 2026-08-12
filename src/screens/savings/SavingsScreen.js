import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency, getStoredAmountForCurrency } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { getGlobalCurrency } from '../../utils/formatCurrency';
import { useSavingsJars } from '../../hooks/useSavings';

const SavingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const activeCurrency = user?.currency || getGlobalCurrency() || 'INR';
  const [activeTab, setActiveTab] = useState('active'); // active | completed | archived

  const {
    data: savingsRes,
    isLoading: savingsLoading,
    refetch: refetchSavingsJars,
  } = useSavingsJars(activeTab, activeCurrency);

  const jars = useMemo(() => savingsRes?.data || [], [savingsRes?.data]);
  const summary = useMemo(
    () =>
      savingsRes?.summary || {
        totalSavings: 0,
        activeJarsCount: 0,
        completedJarsCount: 0,
        archivedJarsCount: 0,
        totalJarsCount: 0,
      },
    [savingsRes?.summary]
  );
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalPeriod, setGoalPeriod] = useState('monthly');
  const [goalNotes, setGoalNotes] = useState('');
  const [savingGoalLoading, setSavingGoalLoading] = useState(false);

  const subscription = useSelector((state) => state.subscription?.subscription);
  const isPremium = subscription?.plan === 'pro' && subscription?.status === 'active';

  const handleOpenGoalModal = () => {
    const existing = summary.periodicGoal?.goal;
    if (existing) {
      setGoalTargetAmount(String(getStoredAmountForCurrency(existing, activeCurrency, 'targetAmount')));
      setGoalPeriod(existing.period || 'monthly');
      setGoalNotes(existing.notes || '');
    } else {
      setGoalTargetAmount('');
      setGoalPeriod('monthly');
      setGoalNotes('');
    }
    setGoalModalVisible(true);
  };

  const totalSavingsDisplay = useMemo(() => {
    if (Array.isArray(jars) && jars.length > 0) {
      return jars.reduce((sum, item) => sum + getStoredAmountForCurrency(item, activeCurrency, 'currentAmount'), 0);
    }
    return Number(summary.totalSavings || 0);
  }, [jars, summary.totalSavings, activeCurrency]);

  const goalSnapshot = summary.periodicGoal?.goal || null;
  const goalSaved = goalSnapshot ? getStoredAmountForCurrency(goalSnapshot, activeCurrency, 'savedInPeriod') : 0;
  const goalTarget = goalSnapshot ? getStoredAmountForCurrency(goalSnapshot, activeCurrency, 'targetAmount') : 0;
  const goalRemaining = goalSnapshot ? Math.max(goalTarget - goalSaved, 0) : 0;
  const goalPercentage = goalSnapshot && goalTarget > 0 ? Math.min(Math.round((goalSaved / goalTarget) * 100), 100) : 0;
  const goalAchieved = goalSnapshot ? goalSaved >= goalTarget && goalTarget > 0 : false;

  const handleSaveGoal = async () => {
    const amountNum = Number(goalTargetAmount);
    if (!goalTargetAmount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid savings target amount greater than 0.');
      return;
    }

    setSavingGoalLoading(true);
    try {
      await savingsApi.setSavingsGoal({
        targetAmount: amountNum,
        period: goalPeriod,
        notes: goalNotes.trim(),
      });
      setGoalModalVisible(false);
      fetchData(true);
      Alert.alert('Success', `${goalPeriod.charAt(0).toUpperCase() + goalPeriod.slice(1)} Savings Goal updated! 🎉`);
    } catch (err) {
      console.log('[SavingsScreen] Save goal error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save Savings Goal');
    } finally {
      setSavingGoalLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    Alert.alert(
      'Remove Savings Goal',
      'Are you sure you want to remove your target savings goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await savingsApi.deleteSavingsGoal();
              setGoalModalVisible(false);
              fetchData(true);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove Savings Goal');
            }
          },
        },
      ]
    );
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await savingsApi.getSavingsJars(activeTab);
      if (res && res.success) {
        setJars(res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }

      // Fetch AI Suggestions
      try {
        const aiRes = await savingsApi.getAISuggestions();
        if (aiRes && aiRes.suggestions) {
          setSuggestions(aiRes.suggestions);
        }
      } catch (_) {
        /* silent catch */
      }
    } catch (err) {
      console.log('[SavingsScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refetchSavingsJars();
    }, [refetchSavingsJars])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSavingsJars();
    setRefreshing(false);
  };

  const handleCreateJar = () => {
    if (!isPremium && summary.activeJarsCount >= 3) {
      Alert.alert(
        'Free Plan Limit Reached',
        'Free users can create up to 3 Savings Jars. Upgrade to Premium for unlimited Savings Jars, AI Savings Insights & Cloud Sync!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade to Pro',
            onPress: () => navigation.navigate('Subscription'),
          },
        ]
      );
      return;
    }
    navigation.navigate('CreateSavingsJar');
  };

  const renderJarCard = ({ item }) => {
    const hasTarget = item.targetAmount && item.targetAmount > 0;
    const currentAmount = getStoredAmountForCurrency(item, activeCurrency, 'currentAmount');
    const targetAmount = getStoredAmountForCurrency(item, activeCurrency, 'targetAmount');
    const percentage = hasTarget
      ? Math.min(Math.round((currentAmount / (targetAmount || 1)) * 100), 100)
      : 0;
    const remaining = hasTarget ? Math.max(targetAmount - currentAmount, 0) : 0;

    return (
      <TouchableOpacity
        style={styles.jarCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('SavingsDetails', { jarId: item._id, initialJar: item })}
      >
        <View style={styles.jarCardHeader}>
          <View style={[styles.iconBox, { backgroundColor: (item.color || '#4C6EF5') + '20' }]}>
            <Text style={styles.iconEmoji}>{item.icon || '🏆'}</Text>
          </View>
          <View style={styles.jarHeaderMeta}>
            <Text style={styles.jarName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.notes ? (
              <Text style={styles.jarNotes} numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === 'completed'
                ? styles.badgeCompleted
                : item.status === 'archived'
                ? styles.badgeArchived
                : styles.badgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'completed'
                  ? styles.badgeTextCompleted
                  : item.status === 'archived'
                  ? styles.badgeTextArchived
                  : styles.badgeTextActive,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Amount Saved & Target */}
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>SAVED</Text>
            <Text style={styles.savedAmountText}>{formatCurrency(currentAmount, activeCurrency)}</Text>
          </View>
          {hasTarget ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountLabel}>TARGET</Text>
              <Text style={styles.targetAmountText}>{formatCurrency(targetAmount, activeCurrency)}</Text>
            </View>
          ) : null}
        </View>

        {/* Progress Bar */}
        {hasTarget ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: item.color || colors.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.progressMetaRow}>
              <Text style={styles.progressText}>{percentage}% Completed</Text>
              <Text style={styles.progressText}>
                {remaining > 0 ? `${formatCurrency(remaining, activeCurrency)} left` : 'Goal Reached! 🎉'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noTargetBadge}>
            <Text style={styles.noTargetText}>No target set</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Savings Jars</Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={handleCreateJar}>
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <FlatList
        data={jars}
        keyExtractor={(item) => item._id}
        renderItem={renderJarCard}
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
          <View style={styles.headerSection}>
            {/* Savings Overview Hero Card */}
            <View style={styles.summaryHeroCard}>
              <Text style={styles.heroSub}>TOTAL SAVINGS</Text>
            <Text style={styles.heroAmount}>{formatCurrency(totalSavingsDisplay, activeCurrency)}</Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{summary.activeJarsCount}</Text>
                  <Text style={styles.statLabel}>Active Jars</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {summary.completedJarsCount}
                  </Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{summary.totalJarsCount}</Text>
                  <Text style={styles.statLabel}>Total Jars</Text>
                </View>
              </View>

              {/* Action Buttons inside Hero Card */}
              <View style={styles.heroActionsRow}>
                <TouchableOpacity
                  style={styles.primaryHeroBtn}
                  activeOpacity={0.85}
                  onPress={handleCreateJar}
                >
                  <Icon name="add-circle" size={18} color="#FFF" />
                  <Text style={styles.primaryHeroBtnText}>Create Jar</Text>
                </TouchableOpacity>

                {summary.activeJarsCount >= 2 ? (
                  <TouchableOpacity
                    style={styles.secondaryHeroBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Transfer')}
                  >
                    <Icon name="swap-horizontal" size={18} color={colors.primary} />
                    <Text style={styles.secondaryHeroBtnText}>Transfer</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Periodic Savings Target / Goal Card */}
            <View style={styles.goalCard}>
              <View style={styles.goalHeaderRow}>
                <View style={styles.goalTitleGroup}>
                  <Text style={styles.goalCardTitle}>🎯 SAVINGS TARGET</Text>
                  {summary.periodicGoal?.hasGoal && (
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>
                        {summary.periodicGoal.goal.period.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editGoalBtn}
                  onPress={handleOpenGoalModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editGoalBtnText}>
                    {summary.periodicGoal?.hasGoal ? 'Edit Goal' : '+ Set Goal'}
                  </Text>
                </TouchableOpacity>
              </View>

              {summary.periodicGoal?.hasGoal ? (
                <View style={styles.goalBody}>
                  <View style={styles.goalAmountRow}>
                    <View>
                      <Text style={styles.goalSavedLabel}>SAVED THIS PERIOD</Text>
                      <Text style={styles.goalSavedValue}>
                      {formatCurrency(goalSaved, activeCurrency)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.goalTargetLabel}>TARGET</Text>
                      <Text style={styles.goalTargetValue}>
                        {formatCurrency(goalTarget, activeCurrency)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalProgressBarTrack}>
                    <View
                      style={[
                        styles.goalProgressBarFill,
                        {
                        width: `${goalPercentage}%`,
                    backgroundColor: goalAchieved
                          ? colors.success
                          : colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.goalProgressMetaRow}>
                    <Text style={styles.goalProgressText}>
                      {goalPercentage}% Achieved
                    </Text>
                    <Text style={styles.goalProgressText}>
                      {goalAchieved
                        ? 'Target Achieved! 🎉'
                        : `${formatCurrency(goalRemaining, activeCurrency)} remaining`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noGoalBody}>
                  <Text style={styles.noGoalText}>
                    Set a Weekly, Monthly or Yearly Savings Goal to track your discipline!
                  </Text>
                </View>
              )}
            </View>

            {/* AI Savings Suggestions Banner (Pro feature) */}
            {suggestions.length > 0 ? (
              <View style={styles.aiBanner}>
                <View style={styles.aiBannerHeader}>
                  <Text style={styles.aiBannerTitle}>✨ AI Savings Insights</Text>
                  {!isPremium ? (
                    <View style={styles.proTag}>
                      <Text style={styles.proTagText}>PRO</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.aiBannerDesc}>{suggestions[0].description}</Text>
              </View>
            ) : null}

            {/* Tabs Bar */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                  Active ({summary.activeJarsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'completed' && styles.tabItemActive]}
                onPress={() => setActiveTab('completed')}
              >
                <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                  Completed ({summary.completedJarsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'archived' && styles.tabItemActive]}
                onPress={() => setActiveTab('archived')}
              >
                <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
                  Archived ({summary.archivedJarsCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Savings Jars...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏺</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active'
                  ? 'No Active Savings Jars'
                  : activeTab === 'completed'
                  ? 'No Completed Jars Yet'
                  : 'No Archived Jars'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'active'
                  ? 'Create digital savings jars for Emergency Fund, Vacation, Bike, Laptop & more!'
                  : 'Complete your savings targets to see them here!'}
              </Text>
              {activeTab === 'active' ? (
                <TouchableOpacity style={styles.emptyCreateBtn} onPress={handleCreateJar}>
                  <Text style={styles.emptyCreateBtnText}>Create Your First Jar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
      />

      {/* Set / Edit Savings Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.goalModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Set Savings Target Goal</Text>
              <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Savings Period</Text>
            <View style={styles.periodChipRow}>
              {['weekly', 'monthly', 'yearly'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodChip, goalPeriod === p && styles.periodChipActive]}
                  onPress={() => setGoalPeriod(p)}
                >
                  <Text style={[styles.periodChipText, goalPeriod === p && styles.periodChipTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Target Amount (₹)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.modalInput}
                value={goalTargetAmount}
                onChangeText={setGoalTargetAmount}
                placeholder="e.g. 10000"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 44 }]}
              value={goalNotes}
              onChangeText={setGoalNotes}
              placeholder="e.g. Monthly disciplined savings"
              placeholderTextColor={colors.text.muted}
            />

            <View style={styles.modalActionsRow}>
              {summary.periodicGoal?.hasGoal ? (
                <TouchableOpacity style={styles.deleteGoalBtn} onPress={handleDeleteGoal}>
                  <Icon name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.saveGoalBtn, { flex: 1 }]}
                onPress={handleSaveGoal}
                disabled={savingGoalLoading}
              >
                {savingGoalLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveGoalBtnText}>Save Target Goal</Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addHeaderBtn: {
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
  headerSection: {
    paddingTop: spacing.md,
  },
  summaryHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  primaryHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full || 20,
    gap: 6,
  },
  primaryHeroBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryHeroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full || 20,
    gap: 6,
  },
  secondaryHeroBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  aiBanner: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aiBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  proTag: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  aiBannerDesc: {
    fontSize: 12,
    color: colors.text.primary,
    marginTop: 4,
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  jarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconEmoji: {
    fontSize: 22,
  },
  jarHeaderMeta: {
    flex: 1,
  },
  jarName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  jarNotes: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: colors.primary + '1F',
  },
  badgeCompleted: {
    backgroundColor: colors.success + '1F',
  },
  badgeArchived: {
    backgroundColor: colors.border,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: colors.primary,
  },
  badgeTextCompleted: {
    color: colors.success,
  },
  badgeTextArchived: {
    color: colors.text.muted,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  savedAmountText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  targetAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  noTargetBadge: {
    marginTop: spacing.xs,
  },
  noTargetText: {
    fontSize: 11,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyCreateBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full || 20,
  },
  emptyCreateBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md + 2,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  periodBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  periodBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  editGoalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
  },
  editGoalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  goalBody: {
    marginTop: spacing.sm + 2,
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  goalSavedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
  },
  goalSavedValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  goalTargetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
  },
  goalTargetValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: 2,
  },
  goalProgressBarTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 4,
  },
  goalProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalProgressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  goalProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  noGoalBody: {
    marginTop: spacing.sm,
  },
  noGoalText: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  goalModalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeaderRow: {
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  periodChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
  },
  periodChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text.primary,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  deleteGoalBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.danger + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveGoalBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveGoalBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default SavingsScreen;
