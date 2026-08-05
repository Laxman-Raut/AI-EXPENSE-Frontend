import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';
import { useSelector } from 'react-redux';

const SavingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('active'); // active | completed | archived
  const [jars, setJars] = useState([]);
  const [summary, setSummary] = useState({
    totalSavings: 0,
    activeJarsCount: 0,
    completedJarsCount: 0,
    archivedJarsCount: 0,
    totalJarsCount: 0,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const subscription = useSelector((state) => state.subscription?.subscription);
  const isPremium = subscription?.plan === 'pro' && subscription?.status === 'active';

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
      fetchData(true);
    }, [activeTab])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
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
    const percentage = hasTarget
      ? Math.min(Math.round((item.currentAmount / item.targetAmount) * 100), 100)
      : 0;
    const remaining = hasTarget ? Math.max(item.targetAmount - item.currentAmount, 0) : 0;

    return (
      <TouchableOpacity
        style={styles.jarCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('SavingsDetails', { jarId: item._id })}
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
            <Text style={styles.savedAmountText}>{formatCurrency(item.currentAmount || 0)}</Text>
          </View>
          {hasTarget ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountLabel}>TARGET</Text>
              <Text style={styles.targetAmountText}>{formatCurrency(item.targetAmount)}</Text>
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
                {remaining > 0 ? `${formatCurrency(remaining)} left` : 'Goal Reached! 🎉'}
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
              <Text style={styles.heroAmount}>{formatCurrency(summary.totalSavings || 0)}</Text>

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
    justify: 'center',
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
});

export default SavingsScreen;
