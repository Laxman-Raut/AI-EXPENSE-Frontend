import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardSummary, useRecentTransactions } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useUnreadCount } from '../../hooks/useNotifications';
import FloatingVoiceButton from '../../components/FloatingVoiceButton';

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

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useDashboardSummary();
  const { data: recentTxns, isLoading: recentLoading, refetch: refetchRecent } = useRecentTransactions();
  const unreadCount = useUnreadCount();

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

  const spentPercent = useMemo(() => {
    if (totalIncome <= 0) return totalExpense > 0 ? 100 : 0;
    return Math.min(Math.round((totalExpense / totalIncome) * 100), 100);
  }, [totalExpense, totalIncome]);

  const savedPercent = useMemo(() => {
    return Math.max(100 - spentPercent, 0);
  }, [spentPercent]);

  // Dynamic Savings Trend Data for the Savings Card
  const savingsChartData = useMemo(() => {
    // If no recent transactions, return mock data for a clean onboarding trend
    if (!recentTxns || recentTxns.length === 0) {
      return [
        { value: 1200, label: '01 Jul' },
        { value: 2500, label: '05 Jul' },
        { value: 1800, label: '10 Jul' },
        { value: 3900, label: '15 Jul' },
        { value: 3200, label: '20 Jul' },
        { value: 5400, label: '25 Jul' },
        { value: savings || 6000, label: 'Today' },
      ];
    }

    // Sort recent transactions in chronological order (oldest first)
    const sortedTxns = [...recentTxns].sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
    );

    let runningSavings = 0;
    const points = [];

    // Loop through transactions to build savings trajectory
    sortedTxns.forEach(txn => {
      if (txn.type === 'income') {
        runningSavings += txn.amount;
      } else {
        runningSavings = Math.max(runningSavings - txn.amount, 0);
      }
      points.push({
        value: runningSavings,
        label: dayjs(txn.transactionDate).format('DD MMM'),
      });
    });

    // If we only have 1 or 2 points, pad it to make a line
    if (points.length < 3) {
      return [
        { value: Math.max(savings * 0.3, 500), label: '01 Jul' },
        { value: Math.max(savings * 0.7, 1000), label: '15 Jul' },
        { value: savings, label: 'Today' },
      ];
    }

    return points;
  }, [recentTxns, savings]);

  // Calculate precise spacing to fit the LineChart exactly within container width
  const chartSpacing = useMemo(() => {
    const N = savingsChartData.length;
    if (N <= 1) return 0;
    return (SCREEN_WIDTH - 74) / (N - 1);
  }, [savingsChartData]);

  // Dynamic Pie Chart Data: Spent vs Saved
  const pieData = useMemo(() => {
    if (totalIncome === 0 && totalExpense === 0) {
      return [
        { value: 100, color: colors.divider, label: 'No Data' }
      ];
    }
    const data = [];
    if (totalExpense > 0) {
      data.push({
        value: totalExpense,
        color: colors.danger || '#FF4D67',
        label: 'Spent',
      });
    }
    const remaining = totalIncome - totalExpense;
    if (remaining > 0) {
      data.push({
        value: remaining,
        color: colors.success || '#00D26A',
        label: 'Saved',
      });
    }
    return data;
  }, [totalIncome, totalExpense]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // Custom Header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.usernameText}>{user?.fullName || 'Laxman Raut'}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.searchBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="notifications-outline" size={20} color={colors.text.primary} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Icon name="calendar-outline" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.searchBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Icon name="search-outline" size={20} color={colors.text.primary} />
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
        {/* Income Spent vs Saved Chart Card */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income Spent vs Saved</Text>
          <Text style={styles.chartAmount}>{spentPercent}% Spent</Text>
          <Text style={[
            styles.chartSubtitle,
            { color: (totalIncome - totalExpense) >= 0 ? colors.success : colors.danger }
          ]}>
            {(totalIncome - totalExpense) >= 0
              ? `Remaining Savings: ${formatCurrency(totalIncome - totalExpense)}`
              : `Overspent by: ${formatCurrency(Math.abs(totalIncome - totalExpense))}`}
          </Text>

          <View style={styles.pieContainer}>
            <PieChart
              data={pieData}
              donut
              radius={85}
              innerRadius={65}
              innerCircleColor={colors.card}
              centerLabelComponent={() => (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{
                    color: colors.text.primary,
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>{spentPercent}%</Text>
                  <Text style={{
                    color: colors.text.muted,
                    fontSize: 9,
                    fontWeight: '700',
                    marginTop: 2,
                    textTransform: 'uppercase',
                  }}>Spent</Text>
                </View>
              )}
            />
          </View>

          {/* Mini Legend list */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger || '#FF4D67' }]} />
              <Text style={styles.legendText}>Spent: {spentPercent}% ({formatCurrency(totalExpense)})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success || '#00D26A' }]} />
              <Text style={styles.legendText}>Saved: {savedPercent}% ({formatCurrency(Math.max(totalIncome - totalExpense, 0))})</Text>
            </View>
          </View>
        </Card>


        {/* Summary Stats Row */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={['rgba(255, 77, 103, 0.12)', 'rgba(255, 77, 103, 0.03)']}
            style={styles.statsBoxGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <View style={styles.statsIconWrapper}>
              <Icon name="arrow-down" size={16} color={colors.danger} />
            </View>
            <Text style={styles.statsBoxLabel}>Total Expenses</Text>
            <Text style={[styles.statsBoxAmount, { color: colors.danger }]}>{formatCurrency(totalExpense)}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(0, 210, 106, 0.12)', 'rgba(0, 210, 106, 0.03)']}
            style={styles.statsBoxGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <View style={styles.statsIconWrapper}>
              <Icon name="arrow-up" size={16} color={colors.success} />
            </View>
            <Text style={styles.statsBoxLabel}>Total Income</Text>
            <Text style={[styles.statsBoxAmount, { color: colors.success }]}>{formatCurrency(totalIncome)}</Text>
          </LinearGradient>
        </View>

        {/* Savings & Sparkline */}
        <LinearGradient
          colors={['#171B30', '#0D0F1F']}
          style={styles.savingsCardGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        >
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

          {/* Interactive Savings Line Chart */}
          <View style={styles.sparklineContainer}>
            <LineChart
              data={savingsChartData}
              width={SCREEN_WIDTH - 74}
              height={100}
              spacing={chartSpacing}
              color={colors.success}
              thickness={3}
              startFillColor={colors.success}
              endFillColor={colors.success}
              startOpacity={0.2}
              endOpacity={0.01}
              initialSpacing={0}
              endSpacing={0}
              hideRules
              hideYAxisText
              hideAxesAndRules
              hideDataPoints={true}
              yAxisLabelWidth={0}
              xAxisLabelsHeight={0}
              overflowBottom={15}
              overflowTop={15}
              curved
              
              // 1. DIRECT PROPS (destructured by the library components)
              showPointerStrip={true}
              pointerStripWidth={1.5}
              pointerStripColor="rgba(255, 255, 255, 0.35)"
              pointerStripUptoDataPoint={true}
              pointerColor={colors.success}
              pointerRadius={6}
              pointerWidth={2}
              activatePointersOnLongPress={false}
              activatePointersInstantlyOnTouch={true}
              pointerLabelWidth={130}
              pointerLabelHeight={34}
              shiftPointerLabelX={-65}
              shiftPointerLabelY={-36}
              pointerLabelComponent={(items) => {
                if (!items) return null;
                const item = Array.isArray(items) ? items[0] : items;
                if (!item || item.value === undefined) return null;
                return (
                  <View style={styles.tooltipContainer}>
                    <Text style={styles.tooltipText}>
                      {formatCurrency(item.value)} • {item.label}
                    </Text>
                  </View>
                );
              }}
              
              // 2. POINTERCONFIG PROP OBJECT (required by wrapper to attach touch listeners)
              pointerConfig={{
                showPointerStrip: true,
                pointerStripWidth: 1.5,
                pointerStripColor: 'rgba(255, 255, 255, 0.35)',
                pointerStripUptoDataPoint: true,
                pointerColor: colors.success,
                pointerRadius: 6,
                pointerWidth: 2,
                activatePointersOnLongPress: false,
                activatePointersInstantlyOnTouch: true,
                pointerLabelWidth: 130,
                pointerLabelHeight: 34,
                shiftPointerLabelX: -65,
                shiftPointerLabelY: -36,
                pointerLabelComponent: (items) => {
                  if (!items) return null;
                  const item = Array.isArray(items) ? items[0] : items;
                  if (!item || item.value === undefined) return null;
                  return (
                    <View style={styles.tooltipContainer}>
                      <Text style={styles.tooltipText}>
                        {formatCurrency(item.value)} • {item.label}
                      </Text>
                    </View>
                  );
                }
              }}
            />
          </View>
        </LinearGradient>

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

      {/* Unified Floating Action Buttons (Voice & Chatbot) */}
      <FloatingVoiceButton />
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
    paddingTop: Platform.OS === 'ios' ? spacing.xl + 8 : spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  usernameText: {
    fontSize: typography.sizes.xl + 2,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
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
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.card,
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
  statsBoxGradient: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statsIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  savingsCardGradient: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    justifyContent: 'center',
    overflow: 'visible',
    paddingBottom: spacing.sm,
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
  tooltipContainer: {
    backgroundColor: '#1E222D',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
