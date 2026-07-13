import React, { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardSummary, useRecentTransactions } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pager category breakdown options
const CATEGORY_COLORS = {
  Food: '#FF9500',
  Shopping: '#FF2D55',
  Travel: '#5856D6',
  Grocery: '#34C759',
  Rent: '#AF52DE',
  Investments: '#007AFF',
  Health: '#FF3B30',
  'EMI/Bill': '#FFCC00',
  Subscriptions: '#5AC8FA',
  Others: '#8E8E93',
};

const PieCenterLabel = () => (
  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
    <Icon name="pie-chart" size={24} color={colors.primary} />
    <Text style={{
      color: colors.text.muted,
      fontSize: 10,
      fontWeight: '600',
      marginTop: 4,
      textTransform: 'uppercase',
    }}>Expenses</Text>
  </View>
);

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useDashboardSummary();
  const { data: recentTxns, isLoading: recentLoading, refetch: refetchRecent } = useRecentTransactions();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'EXPENSES' | 'INCOME'

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchRecent()]);
    setRefreshing(false);
  };

  // Default transactions for fallback
  const fallbackTransactions = [
    {
      _id: 't1',
      description: 'Zepto',
      category: 'Grocery',
      transactionDate: new Date(),
      amount: 820,
      type: 'expense',
      time: 'Today, 11:00 AM',
    },
    {
      _id: 't2',
      description: 'Salary',
      category: 'Salary',
      transactionDate: new Date(Date.now() - 86400000 * 4),
      amount: 95000,
      type: 'income',
      time: 'Jun 01, 11:00 AM',
    },
    {
      _id: 't3',
      description: 'Swiggy',
      category: 'Food',
      transactionDate: new Date(Date.now() - 86400000 * 5),
      amount: 350,
      type: 'expense',
      time: 'May 31, 8:43 PM',
    },
    {
      _id: 't4',
      description: 'Netflix',
      category: 'Subscriptions',
      transactionDate: new Date(Date.now() - 86400000 * 5 - 3600000),
      amount: 649,
      type: 'expense',
      time: 'May 31, 7:30 PM',
    },
  ];

  const transactionsList = recentTxns || [];

  // Filter transactions
  const filteredTransactions = transactionsList.filter(txn => {
    if (activeFilter === 'EXPENSES') return txn.type === 'expense';
    if (activeFilter === 'INCOME') return txn.type === 'income';
    return true;
  });

  // Calculate totals
  const totalExpense = summary?.totalExpense || 0;
  const totalIncome = summary?.totalIncome || 0;
  const savings = Math.max(totalIncome - totalExpense, 0);

  // Dynamic Pie Chart Data
  const pieData = [
    { value: 32, color: CATEGORY_COLORS.Food, label: 'Food' },
    { value: 18, color: CATEGORY_COLORS.Shopping, label: 'Shopping' },
    { value: 12, color: CATEGORY_COLORS.Travel, label: 'Travel' },
    { value: 10, color: CATEGORY_COLORS.Grocery, label: 'Grocery' },
    { value: 8, color: CATEGORY_COLORS.Rent, label: 'Rent' },
    { value: 6, color: CATEGORY_COLORS.Investments, label: 'Investments' },
    { value: 14, color: CATEGORY_COLORS.Others, label: 'Others' },
  ];

  // Render Category Icon Picker helper
  const getCategoryIconInfo = (category, type) => {
    let name = 'receipt-outline';
    let bgColor = '#8E8E93';

    if (type === 'income') {
      name = 'cash-outline';
      bgColor = colors.primary;
    } else {
      switch (category) {
        case 'Food':
          name = 'fast-food-outline';
          bgColor = CATEGORY_COLORS.Food;
          break;
        case 'Shopping':
          name = 'bag-handle-outline';
          bgColor = CATEGORY_COLORS.Shopping;
          break;
        case 'Travel':
          name = 'car-outline';
          bgColor = CATEGORY_COLORS.Travel;
          break;
        case 'Grocery':
          name = 'cart-outline';
          bgColor = CATEGORY_COLORS.Grocery;
          break;
        case 'Rent':
          name = 'home-outline';
          bgColor = CATEGORY_COLORS.Rent;
          break;
        case 'Investments':
          name = 'trending-up-outline';
          bgColor = CATEGORY_COLORS.Investments;
          break;
        case 'Subscriptions':
          name = 'tv-outline';
          bgColor = CATEGORY_COLORS.Subscriptions;
          break;
        default:
          name = 'receipt-outline';
          bgColor = CATEGORY_COLORS.Others;
      }
    }
    return { name, bgColor };
  };

  // Custom Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Overview</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={[styles.searchBtn, { marginRight: spacing.sm }]} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Icon name="calendar-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Icon name="search-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        header={renderHeader()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        style={styles.contentContainer}
      >
        {/* Monthly Expenses Chart Card */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Your Monthly Expenses</Text>
          <Text style={styles.chartAmount}>{formatCurrency(totalExpense)}</Text>
          <Text style={styles.chartSubtitle}>Expenses up by +₹50,849</Text>

          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              donut
              radius={85}
              innerRadius={65}
              innerCircleColor={colors.card}
              centerLabelComponent={PieCenterLabel}
            />
          </View>

          {/* Mini Legend list */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.Food }]} />
              <Text style={styles.legendText}>Food</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.Shopping }]} />
              <Text style={styles.legendText}>Shopping</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.Travel }]} />
              <Text style={styles.legendText}>Travel</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS.Grocery }]} />
              <Text style={styles.legendText}>Grocery</Text>
            </View>
          </View>
        </Card>

        {/* Tab Filters */}
        <View style={styles.filterContainer}>
          {['ALL', 'EXPENSES', 'INCOME'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter ? styles.activeFilterTab : null
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter ? styles.activeFilterTabText : null
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statsBox}>
            <Text style={styles.statsBoxLabel}>Total Expenses</Text>
            <Text style={styles.statsBoxAmount}>{formatCurrency(totalExpense)}</Text>
          </Card>
          <Card style={styles.statsBox}>
            <Text style={styles.statsBoxLabel}>Total Income</Text>
            <Text style={[styles.statsBoxAmount, { color: colors.success }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </Card>
        </View>

        {/* Savings & Sparkline */}
        <Card style={styles.savingsCard}>
          <View style={styles.savingsHeader}>
            <View>
              <Text style={styles.savingsLabel}>Savings</Text>
              <Text style={styles.savingsAmount}>
                {formatCurrency(savings)} <Text style={styles.savingsPeriod}>This Month</Text>
              </Text>
            </View>
            <View style={styles.savingsGrowthBox}>
              <Icon name="trending-up" size={14} color={colors.success} />
              <Text style={styles.savingsGrowthText}>+12.4%</Text>
            </View>
          </View>

          {/* Sparkline svg representation */}
          <View style={styles.sparklineContainer}>
            <Svg height="48" width={SCREEN_WIDTH - 64} viewBox="0 0 300 50">
              <Defs>
                <SvgGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.success} stopOpacity="0.3" />
                  <Stop offset="100%" stopColor={colors.success} stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path
                d="M0,40 Q30,15 60,35 T120,20 T180,30 T240,10 T300,25"
                fill="none"
                stroke={colors.success}
                strokeWidth="2.5"
              />
              <Path
                d="M0,40 Q30,15 60,35 T120,20 T180,30 T240,10 T300,25 L300,50 L0,50 Z"
                fill="url(#sparklineGrad)"
              />
            </Svg>
          </View>
        </Card>

        {/* Monthly Budget Card */}
        {user?.monthlyBudget ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Budget')}
            style={styles.budgetCardContainer}
          >
            <Card style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetTitleRow}>
                  <Icon name="wallet-outline" size={18} color={colors.primary} />
                  <Text style={styles.budgetTitle}>Monthly Budget Limit</Text>
                </View>
                <Text style={styles.budgetValueText}>
                  {formatCurrency(totalExpense)} / {formatCurrency(user.monthlyBudget)}
                </Text>
              </View>
              <View style={styles.budgetProgressBarBg}>
                <View
                  style={[
                    styles.budgetProgressBarFill,
                    {
                      width: `${Math.min(Math.round((totalExpense / user.monthlyBudget) * 100), 100)}%`,
                      backgroundColor: (totalExpense / user.monthlyBudget) >= 0.9 ? colors.danger : colors.primary
                    }
                  ]}
                />
              </View>
              <View style={styles.budgetFooter}>
                <Text style={styles.budgetPercentText}>
                  {Math.round((totalExpense / user.monthlyBudget) * 100)}% utilized
                </Text>
                <Text style={[
                  styles.budgetRemainingText,
                  { color: user.monthlyBudget - totalExpense >= 0 ? colors.success : colors.danger }
                ]}>
                  {user.monthlyBudget - totalExpense >= 0
                    ? `${formatCurrency(user.monthlyBudget - totalExpense)} remaining`
                    : `${formatCurrency(Math.abs(user.monthlyBudget - totalExpense))} overspent`}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ) : null}

        {/* Recent Transactions List */}
        <View style={styles.transactionsHeaderRow}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsListContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyRecentContainer}>
              <Icon name="receipt-outline" size={32} color={colors.text.muted} />
              <Text style={styles.emptyRecentText}>No recent transactions</Text>
            </View>
          ) : (
            filteredTransactions.map((txn) => {
              const iconInfo = getCategoryIconInfo(txn.category, txn.type);
              const isExpense = txn.type === 'expense';
              return (
                <TouchableOpacity
                  key={txn._id}
                  style={styles.txnItem}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
                >
                  <View style={styles.txnLeft}>
                    <View style={[styles.txnIconBox, { backgroundColor: iconInfo.bgColor + '20' }]}>
                      <Icon name={iconInfo.name} size={20} color={iconInfo.bgColor} />
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnName}>{txn.description}</Text>
                      <Text style={styles.txnCategory}>{txn.category}</Text>
                    </View>
                  </View>
                  <View style={styles.txnRight}>
                    <Text style={[styles.txnAmount, isExpense ? styles.expenseText : styles.incomeText]}>
                      {isExpense ? '-' : '+'}{formatCurrency(txn.amount)}
                    </Text>
                    <Text style={styles.txnTime}>
                      {txn.time || (txn.transactionDate ? formatDate(txn.transactionDate) : 'Today')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Padding for absolute tab bar */}
        <View style={{ height: 100 }} />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthSelectText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  chartCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  chartTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  chartAmount: {
    fontSize: typography.sizes.display - 4,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  pieContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pieCenterTextWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieCenterLabel: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  filterTab: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: colors.secondary,
  },
  filterTabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeFilterTabText: {
    color: colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statsBox: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsBoxLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  statsBoxAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  savingsCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savingsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  savingsPeriod: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.regular,
  },
  savingsGrowthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 2,
  },
  savingsGrowthText: {
    color: colors.success,
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
  },
  sparklineContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionsTitle: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  transactionsListContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  txnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  txnIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnInfo: {
    justifyContent: 'center',
  },
  txnName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  txnCategory: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  expenseText: {
    color: colors.text.primary,
  },
  incomeText: {
    color: colors.success,
  },
  txnTime: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.muted,
  },
  emptyRecentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyRecentText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  budgetCardContainer: {
    marginBottom: spacing.xxl,
  },
  budgetCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  budgetTitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  budgetValueText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  budgetProgressBarBg: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  budgetProgressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetPercentText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
  },
  budgetRemainingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});

export default DashboardScreen;
