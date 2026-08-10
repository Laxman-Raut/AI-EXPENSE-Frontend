import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTransactions } from '../../hooks/useTransactions';
import BankLogo from '../../components/atoms/BankLogo';

dayjs.extend(isBetween);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

const CATEGORY_COLORS = [
  '#FF9500', // Food - Orange
  '#FF2D55', // Shopping - Pink
  '#34C759', // Bills - Green
  '#5856D6', // Travel - Purple
  '#00D26A', // Salary - Mint Green
  '#AF52DE', // Investments - Violet
  '#FF3B30', // Health - Red
  '#5AC8FA', // Entertainment - Sky Blue
  '#FFCC00', // Education - Yellow
  '#8E8E93', // Others - Grey
];

const getCategoryIcon = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('dining')) return 'fast-food';
  if (c.includes('shop') || c.includes('grocer')) return 'bag-handle';
  if (c.includes('travel') || c.includes('flight') || c.includes('cab')) return 'airplane';
  if (c.includes('bill') || c.includes('recharge') || c.includes('utility')) return 'receipt';
  if (c.includes('salary') || c.includes('income')) return 'cash';
  if (c.includes('invest') || c.includes('stock')) return 'trending-up';
  if (c.includes('health') || c.includes('med')) return 'heart-pulse';
  if (c.includes('entertain') || c.includes('movie')) return 'game-controller';
  return 'pie-chart';
};

const AnalyticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'today' | 'month' | 'year' | 'all'
  const [chartType, setChartType] = useState('expense'); // 'expense' | 'income'

  const userCurrency = useSelector((state) => state.auth?.user?.currency || state.app?.currency || 'INR');
  const { data: transactions = [], isLoading } = useTransactions();

  // ─────────────────────────────────────────────────────────────
  // 1. FILTER TRANSACTIONS BY SELECTED PERIOD
  // ─────────────────────────────────────────────────────────────
  const periodFilteredTxns = useMemo(() => {
    const now = dayjs();
    return transactions.filter((t) => {
      const d = dayjs(t.transactionDate || t.createdAt);
      if (selectedPeriod === 'today') {
        return d.isSame(now, 'day');
      }
      if (selectedPeriod === 'month') {
        return d.isSame(now, 'month');
      }
      if (selectedPeriod === 'year') {
        return d.isSame(now, 'year');
      }
      return true; // 'all'
    });
  }, [transactions, selectedPeriod]);

  // ─────────────────────────────────────────────────────────────
  // 2. OVERVIEW STATS (Income, Expenses, Net Savings, Savings Rate)
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    periodFilteredTxns.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
    };
  }, [periodFilteredTxns]);

  // ─────────────────────────────────────────────────────────────
  // 3. TREND LINE CHART DATA (Day / Month / Year)
  // ─────────────────────────────────────────────────────────────
  const trendChartData = useMemo(() => {
    const now = dayjs();
    const isExp = chartType === 'expense';
    const filtered = periodFilteredTxns.filter((t) => (isExp ? t.type === 'expense' : t.type === 'income'));

    let points = [];

    if (selectedPeriod === 'today') {
      const hours = [0, 4, 8, 12, 16, 20, 23];
      const hourTotals = Array(7).fill(0);
      filtered.forEach((t) => {
        const h = dayjs(t.transactionDate || t.createdAt).hour();
        const idx = Math.min(6, Math.floor(h / 4));
        hourTotals[idx] += Number(t.amount) || 0;
      });
      points = hours.map((h, i) => ({
        value: hourTotals[i],
        label: `${h}:00`,
      }));
    } else if (selectedPeriod === 'month') {
      const daysInMonth = now.daysInMonth();
      const interval = Math.ceil(daysInMonth / 6);
      const dayTotals = {};
      filtered.forEach((t) => {
        const dayNum = dayjs(t.transactionDate || t.createdAt).date();
        dayTotals[dayNum] = (dayTotals[dayNum] || 0) + (Number(t.amount) || 0);
      });
      for (let d = 1; d <= daysInMonth; d += interval) {
        points.push({
          value: dayTotals[d] || 0,
          label: `${d} ${now.format('MMM')}`,
        });
      }
    } else if (selectedPeriod === 'year') {
      const monthTotals = Array(12).fill(0);
      filtered.forEach((t) => {
        const m = dayjs(t.transactionDate || t.createdAt).month();
        monthTotals[m] += Number(t.amount) || 0;
      });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      points = monthNames.map((m, i) => ({
        value: monthTotals[i],
        label: m,
      }));
    } else {
      // All Time: group by last 6 months
      const months = Array.from({ length: 6 }, (_, i) => now.subtract(5 - i, 'month'));
      const monthTotals = Array(6).fill(0);
      filtered.forEach((t) => {
        const d = dayjs(t.transactionDate || t.createdAt);
        const idx = months.findIndex((m) => m.isSame(d, 'month'));
        if (idx !== -1) {
          monthTotals[idx] += Number(t.amount) || 0;
        }
      });
      points = months.map((m, i) => ({
        value: monthTotals[i],
        label: m.format('MMM'),
      }));
    }

    const hasData = points.some((p) => p.value > 0);
    return { points, hasData };
  }, [periodFilteredTxns, selectedPeriod, chartType]);

  // ─────────────────────────────────────────────────────────────
  // 4. CATEGORY EXPENSE BREAKDOWN (Where did money go?)
  // ─────────────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const expenses = periodFilteredTxns.filter((t) => t.type === 'expense');
    const catMap = {};
    let totalCatExpense = 0;

    expenses.forEach((t) => {
      const cat = t.category || 'Others';
      const amt = Number(t.amount) || 0;
      catMap[cat] = (catMap[cat] || 0) + amt;
      totalCatExpense += amt;
    });

    const list = Object.keys(catMap)
      .map((cat, idx) => {
        const amt = catMap[cat];
        const pct = totalCatExpense > 0 ? Math.round((amt / totalCatExpense) * 100) : 0;
        return {
          name: cat,
          amount: amt,
          percentage: pct,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          icon: getCategoryIcon(cat),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const pieData =
      list.length > 0
        ? list.map((c) => ({
            value: c.percentage || 1,
            color: c.color,
            text: `${c.percentage}%`,
          }))
        : [{ value: 100, color: 'rgba(255, 255, 255, 0.1)', text: '0%' }];

    return { list, pieData, totalCatExpense };
  }, [periodFilteredTxns]);

  // ─────────────────────────────────────────────────────────────
  // 5. OUTFLOW BANK BREAKDOWN (Money spent from which bank?)
  // ─────────────────────────────────────────────────────────────
  const outflowBankBreakdown = useMemo(() => {
    const expenses = periodFilteredTxns.filter((t) => t.type === 'expense');
    const bankMap = {};
    let totalOutflow = 0;

    expenses.forEach((t) => {
      const amt = Number(t.amount) || 0;
      let bankName = 'Unlinked / Cash';
      let accNo = '';

      if (t.bankAccount) {
        if (typeof t.bankAccount === 'object') {
          bankName = t.bankAccount.nickname || t.bankAccount.bankName || 'Bank Account';
          accNo = t.bankAccount.accountNumber || '';
        } else {
          bankName = 'Linked Bank';
        }
      }

      if (!bankMap[bankName]) {
        bankMap[bankName] = { bankName, accNo, amount: 0, count: 0 };
      }
      bankMap[bankName].amount += amt;
      bankMap[bankName].count += 1;
      totalOutflow += amt;
    });

    const list = Object.values(bankMap)
      .map((b) => ({
        ...b,
        percentage: totalOutflow > 0 ? Math.round((b.amount / totalOutflow) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { list, totalOutflow };
  }, [periodFilteredTxns]);

  // ─────────────────────────────────────────────────────────────
  // 6. INFLOW BANK BREAKDOWN (Money received in which bank?)
  // ─────────────────────────────────────────────────────────────
  const inflowBankBreakdown = useMemo(() => {
    const incomes = periodFilteredTxns.filter((t) => t.type === 'income');
    const bankMap = {};
    let totalInflow = 0;

    incomes.forEach((t) => {
      const amt = Number(t.amount) || 0;
      let bankName = 'Unlinked / Cash';
      let accNo = '';

      if (t.bankAccount) {
        if (typeof t.bankAccount === 'object') {
          bankName = t.bankAccount.nickname || t.bankAccount.bankName || 'Bank Account';
          accNo = t.bankAccount.accountNumber || '';
        } else {
          bankName = 'Deposit Bank';
        }
      }

      if (!bankMap[bankName]) {
        bankMap[bankName] = { bankName, accNo, amount: 0, count: 0 };
      }
      bankMap[bankName].amount += amt;
      bankMap[bankName].count += 1;
      totalInflow += amt;
    });

    const list = Object.values(bankMap)
      .map((b) => ({
        ...b,
        percentage: totalInflow > 0 ? Math.round((b.amount / totalInflow) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { list, totalInflow };
  }, [periodFilteredTxns]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Analyzing financial data...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Analytics & Insights</Text>
        <Text style={styles.headerSubtitle}>Complete Money Flow Breakdown</Text>
      </View>

      <View style={styles.headerBadge}>
        <Icon name="stats-chart" size={14} color={colors.primary} />
        <Text style={styles.headerBadgeText}>LIVE</Text>
      </View>
    </View>
  );

  const gridWidth = SCREEN_WIDTH - 64;

  return (
    <View style={styles.root}>
      <Screen scrollable header={renderHeader()} style={styles.contentContainer}>
        {/* Period Selector Tabs (Today, Month, Year, All) */}
        <View style={styles.periodPillRow}>
          {PERIODS.map((p) => {
            const isSel = selectedPeriod === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.periodPill, isSel && styles.periodPillSelected]}
                onPress={() => setSelectedPeriod(p.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodPillText, isSel && styles.periodPillTextSelected]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero 4-Grid Financial Overview Cards */}
        <View style={styles.statsGrid}>
          {/* Total Income */}
          <LinearGradient
            colors={['#142823', '#0B1714']}
            style={[styles.statBox, { borderColor: 'rgba(0, 210, 106, 0.3)' }]}
          >
            <View style={styles.statIconBgSuccess}>
              <Icon name="arrow-down" size={16} color="#00D26A" />
            </View>
            <Text style={styles.statLabel}>Total Income</Text>
            <Text style={[styles.statValue, { color: '#00D26A' }]}>
              {formatCurrency(stats.totalIncome, 'INR', userCurrency)}
            </Text>
          </LinearGradient>

          {/* Total Expenses */}
          <LinearGradient
            colors={['#2E161C', '#1A0B0E']}
            style={[styles.statBox, { borderColor: 'rgba(255, 77, 103, 0.3)' }]}
          >
            <View style={styles.statIconBgDanger}>
              <Icon name="arrow-up" size={16} color="#FF4D67" />
            </View>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statValue, { color: '#FF4D67' }]}>
              {formatCurrency(stats.totalExpense, 'INR', userCurrency)}
            </Text>
          </LinearGradient>

          {/* Net Balance / Savings */}
          <LinearGradient
            colors={['#192238', '#0E1424']}
            style={[styles.statBox, { borderColor: 'rgba(138, 63, 252, 0.3)' }]}
          >
            <View style={styles.statIconBgPrimary}>
              <Icon name="wallet-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Net Balance</Text>
            <Text style={[styles.statValue, { color: stats.netSavings >= 0 ? colors.text.primary : '#FF4D67' }]}>
              {formatCurrency(stats.netSavings, 'INR', userCurrency)}
            </Text>
          </LinearGradient>

          {/* Savings Rate */}
          <LinearGradient
            colors={['#2A2415', '#19150B']}
            style={[styles.statBox, { borderColor: 'rgba(255, 182, 72, 0.3)' }]}
          >
            <View style={styles.statIconBgAmber}>
              <Icon name="pie-chart-outline" size={16} color="#FFB648" />
            </View>
            <Text style={styles.statLabel}>Savings Rate</Text>
            <Text style={[styles.statValue, { color: '#FFB648' }]}>
              {stats.savingsRate}% Saved
            </Text>
          </LinearGradient>
        </View>

        {/* Section 1: Financial Trend Chart (Expenses vs Income Toggle) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Financial Trend</Text>
            <View style={styles.chartToggleContainer}>
              <TouchableOpacity
                style={[styles.chartToggleBtn, chartType === 'expense' && styles.chartToggleBtnActiveExp]}
                onPress={() => setChartType('expense')}
              >
                <Text style={[styles.chartToggleText, chartType === 'expense' && styles.chartToggleTextActiveExp]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartToggleBtn, chartType === 'income' && styles.chartToggleBtnActiveInc]}
                onPress={() => setChartType('income')}
              >
                <Text style={[styles.chartToggleText, chartType === 'income' && styles.chartToggleTextActiveInc]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Card style={styles.chartCard}>
            <LineChart
              data={trendChartData.points}
              width={gridWidth}
              height={170}
              color={chartType === 'expense' ? '#FF4D67' : '#00D26A'}
              thickness={3}
              startFillColor={chartType === 'expense' ? '#FF4D67' : '#00D26A'}
              endFillColor={chartType === 'expense' ? '#FF4D67' : '#00D26A'}
              startOpacity={0.2}
              endOpacity={0.01}
              noOfSections={4}
              rulesColor="rgba(255, 255, 255, 0.05)"
              rulesType="solid"
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              hideDataPoints={false}
              dataPointsColor={chartType === 'expense' ? '#FF4D67' : '#00D26A'}
              dataPointsRadius={4}
              curved
              animateOnDataChange
              animationDuration={500}
            />
          </Card>
        </View>

        {/* Section 2: Where Did Money Go? (Category Expense Breakdown) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Where Did Money Go? (Category Expenses)</Text>
          <Card style={styles.cardContainer}>
            <View style={styles.donutRow}>
              <View style={styles.donutWrapper}>
                <PieChart
                  data={categoryBreakdown.pieData}
                  donut
                  radius={64}
                  innerRadius={44}
                  innerCircleColor={colors.card}
                  showText={false}
                />
                <View style={styles.donutCenterText}>
                  <Text style={styles.donutCenterVal}>
                    {formatCurrency(categoryBreakdown.totalCatExpense, 'INR', userCurrency)}
                  </Text>
                  <Text style={styles.donutCenterSub}>SPENT</Text>
                </View>
              </View>

              <View style={styles.catLegendList}>
                {categoryBreakdown.list.length > 0 ? (
                  categoryBreakdown.list.slice(0, 4).map((cat) => (
                    <View key={cat.name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.legendPct}>{cat.percentage}%</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyLegendText}>No expenses recorded</Text>
                )}
              </View>
            </View>

            {/* Category Progress Bars List */}
            {categoryBreakdown.list.map((cat) => (
              <View key={cat.name} style={styles.catBarRow}>
                <View style={styles.catBarHeader}>
                  <View style={styles.catBarLeft}>
                    <Icon name={cat.icon} size={15} color={cat.color} style={{ marginRight: 6 }} />
                    <Text style={styles.catBarName}>{cat.name}</Text>
                  </View>
                  <View style={styles.catBarRight}>
                    <Text style={styles.catBarAmt}>{formatCurrency(cat.amount, 'INR', userCurrency)}</Text>
                    <Text style={styles.catBarPct}> ({cat.percentage}%)</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, cat.percentage)}%`, backgroundColor: cat.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* Section 3: Money Spent From Which Bank? (Outflow Breakdown) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Money Spent From Which Bank?</Text>
            <View style={styles.bankTagOutflow}>
              <Icon name="arrow-up" size={12} color="#FF4D67" />
              <Text style={styles.bankTagOutflowText}>OUTFLOW</Text>
            </View>
          </View>

          <Card style={styles.cardContainer}>
            {outflowBankBreakdown.list.length > 0 ? (
              outflowBankBreakdown.list.map((bank) => (
                <View key={bank.bankName} style={styles.bankItemRow}>
                  <View style={styles.bankItemHeader}>
                    <View style={styles.bankItemLeft}>
                      <BankLogo bankName={bank.bankName} size={28} style={{ marginRight: 8 }} />
                      <View>
                        <Text style={styles.bankItemName}>{bank.bankName}</Text>
                        <Text style={styles.bankItemSub}>{bank.count} Outgoing Transactions</Text>
                      </View>
                    </View>
                    <View style={styles.bankItemRight}>
                      <Text style={[styles.bankItemAmt, { color: '#FF4D67' }]}>
                        -{formatCurrency(bank.amount, 'INR', userCurrency)}
                      </Text>
                      <Text style={styles.bankItemPct}>{bank.percentage}% of Outflow</Text>
                    </View>
                  </View>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.min(100, bank.percentage)}%`, backgroundColor: '#FF4D67' },
                      ]}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBankState}>
                <Icon name="card-outline" size={32} color={colors.text.muted} />
                <Text style={styles.emptyBankText}>No bank outflows recorded in this period</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Section 4: Money Received In Which Bank? (Inflow Breakdown) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Money Received In Which Bank?</Text>
            <View style={styles.bankTagInflow}>
              <Icon name="arrow-down" size={12} color="#00D26A" />
              <Text style={styles.bankTagInflowText}>INFLOW</Text>
            </View>
          </View>

          <Card style={styles.cardContainer}>
            {inflowBankBreakdown.list.length > 0 ? (
              inflowBankBreakdown.list.map((bank) => (
                <View key={bank.bankName} style={styles.bankItemRow}>
                  <View style={styles.bankItemHeader}>
                    <View style={styles.bankItemLeft}>
                      <BankLogo bankName={bank.bankName} size={28} style={{ marginRight: 8 }} />
                      <View>
                        <Text style={styles.bankItemName}>{bank.bankName}</Text>
                        <Text style={styles.bankItemSub}>{bank.count} Incoming Deposits</Text>
                      </View>
                    </View>
                    <View style={styles.bankItemRight}>
                      <Text style={[styles.bankItemAmt, { color: '#00D26A' }]}>
                        +{formatCurrency(bank.amount, 'INR', userCurrency)}
                      </Text>
                      <Text style={styles.bankItemPct}>{bank.percentage}% of Inflow</Text>
                    </View>
                  </View>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.min(100, bank.percentage)}%`, backgroundColor: '#00D26A' },
                      ]}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBankState}>
                <Icon name="wallet-outline" size={32} color={colors.text.muted} />
                <Text style={styles.emptyBankText}>No bank deposits recorded in this period</Text>
              </View>
            )}
          </Card>
        </View>

        <View style={{ height: spacing.xxl }} />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  periodPillRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.full,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  periodPillSelected: {
    backgroundColor: colors.primary,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  statIconBgSuccess: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBgDanger: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBgPrimary: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statIconBgAmber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 182, 72, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  chartToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.md,
    padding: 2,
  },
  chartToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md - 2,
  },
  chartToggleBtnActiveExp: {
    backgroundColor: 'rgba(255, 77, 103, 0.2)',
  },
  chartToggleBtnActiveInc: {
    backgroundColor: 'rgba(0, 210, 106, 0.2)',
  },
  chartToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  chartToggleTextActiveExp: {
    color: '#FF4D67',
    fontWeight: '700',
  },
  chartToggleTextActiveInc: {
    color: '#00D26A',
    fontWeight: '700',
  },
  chartCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  axisText: {
    color: colors.text.muted,
    fontSize: 9,
  },
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  donutWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterVal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.primary,
  },
  donutCenterSub: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.text.muted,
  },
  catLegendList: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  legendName: {
    flex: 1,
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  legendPct: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyLegendText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  catBarRow: {
    marginBottom: spacing.sm,
  },
  catBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catBarName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  catBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catBarAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  catBarPct: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  bankTagOutflow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  bankTagOutflowText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF4D67',
  },
  bankTagInflow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  bankTagInflowText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D26A',
  },
  bankItemRow: {
    marginBottom: spacing.md,
  },
  bankItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bankItemSub: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  bankItemRight: {
    alignItems: 'flex-end',
  },
  bankItemAmt: {
    fontSize: 13,
    fontWeight: '700',
  },
  bankItemPct: {
    fontSize: 10,
    color: colors.text.muted,
  },
  emptyBankState: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  emptyBankText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default AnalyticsScreen;
