import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardSummary, useRecentTransactions, useMonthlyAnalytics } from '../../hooks/useDashboard';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatMonthName } from '../../utils/formatDate';
import { Transaction, MonthlyAnalytics } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, string> = {
  food: 'fast-food-outline',
  transport: 'car-outline',
  shopping: 'bag-outline',
  entertainment: 'game-controller-outline',
  health: 'heart-outline',
  bills: 'receipt-outline',
  education: 'school-outline',
  salary: 'cash-outline',
  freelance: 'laptop-outline',
  investment: 'trending-up-outline',
  rent: 'home-outline',
  travel: 'airplane-outline',
  default: 'ellipsis-horizontal-outline',
};

const getCategoryIcon = (category: string): string => {
  const key = category.toLowerCase();
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
};

const DashboardScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useDashboardSummary();
  const { data: recentTxns, isLoading: recentLoading, refetch: refetchRecent } = useRecentTransactions();
  const { data: analytics, refetch: refetchAnalytics } = useMonthlyAnalytics();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchRecent(), refetchAnalytics()]);
    setRefreshing(false);
  };

  if (summaryLoading && !summary) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const getFirstName = () => {
    if (!user?.fullName) return 'User';
    return user.fullName.split(' ')[0];
  };

  const maxChartValue = analytics
    ? Math.max(...analytics.map((a: MonthlyAnalytics) => Math.max(a.income, a.expense)), 1)
    : 1;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Good {getGreeting()},</Text>
              <Text style={styles.userName}>{getFirstName()} 👋</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Icon name="notifications-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <GlassCard style={styles.summaryCard} variant="income">
                <View style={styles.summaryIconRow}>
                  <View style={[styles.summaryIconBg, { backgroundColor: Colors.incomeBg }]}>
                    <Icon name="arrow-down-outline" size={18} color={Colors.income} />
                  </View>
                </View>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryAmount, { color: Colors.income }]}>
                  {formatCurrency(summary?.totalIncome || 0)}
                </Text>
              </GlassCard>

              <GlassCard style={styles.summaryCard} variant="expense">
                <View style={styles.summaryIconRow}>
                  <View style={[styles.summaryIconBg, { backgroundColor: Colors.expenseBg }]}>
                    <Icon name="arrow-up-outline" size={18} color={Colors.expense} />
                  </View>
                </View>
                <Text style={styles.summaryLabel}>Expense</Text>
                <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
                  {formatCurrency(summary?.totalExpense || 0)}
                </Text>
              </GlassCard>
            </View>

            <GlassCard style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Total Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCurrency(summary?.balance || 0)}
                  </Text>
                </View>
                <View style={styles.txnCountBadge}>
                  <Text style={styles.txnCountText}>
                    {summary?.transactionCount || 0}
                  </Text>
                  <Text style={styles.txnCountLabel}>transactions</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Monthly Chart */}
          {analytics && analytics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Overview</Text>
              <GlassCard>
                <View style={styles.chartContainer}>
                  {analytics.map((item: MonthlyAnalytics, index: number) => (
                    <View key={index} style={styles.chartBarGroup}>
                      <View style={styles.chartBarsWrapper}>
                        <View
                          style={[
                            styles.chartBar,
                            styles.incomeBar,
                            { height: Math.max((item.income / maxChartValue) * 100, 4) },
                          ]}
                        />
                        <View
                          style={[
                            styles.chartBar,
                            styles.expenseBar,
                            { height: Math.max((item.expense / maxChartValue) * 100, 4) },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>
                        {formatMonthName(item._id.month)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.income }]} />
                    <Text style={styles.legendText}>Income</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.expense }]} />
                    <Text style={styles.legendText}>Expense</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TransactionsTab')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentLoading && !recentTxns ? (
              <GlassCard>
                <Text style={styles.emptyText}>Loading...</Text>
              </GlassCard>
            ) : !recentTxns || recentTxns.length === 0 ? (
              <GlassCard>
                <View style={styles.emptyState}>
                  <Icon name="receipt-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No transactions yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap + to add your first transaction
                  </Text>
                </View>
              </GlassCard>
            ) : (
              recentTxns.map((txn: Transaction) => (
                <TouchableOpacity
                  key={txn._id}
                  onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
                  activeOpacity={0.7}>
                  <GlassCard style={styles.txnCard}>
                    <View style={styles.txnRow}>
                      <View
                        style={[
                          styles.txnIconBg,
                          {
                            backgroundColor:
                              txn.type === 'income' ? Colors.incomeBg : Colors.expenseBg,
                          },
                        ]}>
                        <Icon
                          name={getCategoryIcon(txn.category)}
                          size={20}
                          color={txn.type === 'income' ? Colors.income : Colors.expense}
                        />
                      </View>
                      <View style={styles.txnInfo}>
                        <Text style={styles.txnDescription} numberOfLines={1}>
                          {txn.description}
                        </Text>
                        <Text style={styles.txnCategory}>
                          {txn.category} • {formatDate(txn.transactionDate)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.txnAmount,
                          {
                            color: txn.type === 'income' ? Colors.income : Colors.expense,
                          },
                        ]}>
                        {txn.type === 'income' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryIconRow: {
    marginBottom: Spacing.md,
  },
  summaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    ...Typography.amountSmall,
  },
  balanceCard: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.borderLight,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    ...Typography.amount,
    color: Colors.textPrimary,
  },
  txnCountBadge: {
    alignItems: 'center',
    backgroundColor: Colors.glass,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txnCountText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  txnCountLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  section: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: Spacing.base,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: Spacing.sm,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: Colors.income,
  },
  expenseBar: {
    backgroundColor: Colors.expense,
  },
  chartLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    fontSize: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  txnCard: {
    marginBottom: Spacing.sm,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  txnInfo: {
    flex: 1,
  },
  txnDescription: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  txnCategory: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txnAmount: {
    ...Typography.amountSmall,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default DashboardScreen;
