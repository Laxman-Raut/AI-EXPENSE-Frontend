import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTransactions } from '../../hooks/useTransactions';

dayjs.extend(isBetween);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIMEFRAMES = [
  { key: 'DAY', label: 'Day' },
  { key: 'WEEK', label: 'Week' },
  { key: 'MONTH', label: 'Month' },
  { key: 'YEAR', label: 'Year' },
];

const CATEGORY_COLORS = [
  '#8A3FFC', // Purple
  '#FF6037', // Orange/Accent
  '#00D26A', // Mint Green
  '#FF4D67', // Rose Red
  '#FFB648', // Amber Gold
  '#4B8CFF', // Tech Blue
  '#AF52DE', // Purple-Pink
  '#5AC8FA', // Sky Blue
  '#FFCC00', // Yellow
  '#8E8E93', // Muted Grey
];

const AnalyticsScreen = () => {
  const [activeTab, setActiveTab] = useState('EXPENSES'); // 'EXPENSES' | 'INCOME'
  const [timeframe, setTimeframe] = useState('MONTH'); // 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

  // Fetch all transactions
  const { data: transactions = [], isLoading } = useTransactions();

  // ─────────────────────────────────────────────────────────────
  // 1. TIMEFRAME FILTERING & DATA GROUPING
  // ─────────────────────────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const now = dayjs();
    const type = activeTab === 'EXPENSES' ? 'expense' : 'income';
    
    // Filter transactions by type first
    const typeFiltered = transactions.filter(t => t.type === type);

    let chartData = [];
    let timeframeFiltered = [];
    let title = '';

    if (timeframe === 'DAY') {
      title = 'Daily Spending (This Week)';
      const startOfWeek = now.startOf('week'); // Sunday or Monday depending on locale (default Sunday)
      const endOfWeek = now.endOf('week');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isBetween(startOfWeek, endOfWeek, 'day', '[]');
      });

      // Group by day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const grouped = Array(7).fill(0);
      timeframeFiltered.forEach(t => {
        const dayIdx = dayjs(t.transactionDate).day();
        grouped[dayIdx] += t.amount;
      });

      chartData = days.map((day, idx) => ({
        value: grouped[idx],
        label: day,
      }));

    } else if (timeframe === 'WEEK') {
      title = 'Weekly Spending (This Month)';
      const startOfMonth = now.startOf('month');
      const endOfMonth = now.endOf('month');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isBetween(startOfMonth, endOfMonth, 'day', '[]');
      });

      // Group by week of month (W1: 1-7, W2: 8-14, W3: 15-21, W4: 22+)
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      timeframeFiltered.forEach(t => {
        const date = dayjs(t.transactionDate).date();
        if (date <= 7) w1 += t.amount;
        else if (date <= 14) w2 += t.amount;
        else if (date <= 21) w3 += t.amount;
        else w4 += t.amount;
      });

      chartData = [
        { value: w1, label: 'Wk 1' },
        { value: w2, label: 'Wk 2' },
        { value: w3, label: 'Wk 3' },
        { value: w4, label: 'Wk 4' },
      ];

    } else if (timeframe === 'MONTH') {
      title = 'Monthly Spending (This Year)';
      const startOfYear = now.startOf('year');
      const endOfYear = now.endOf('year');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isBetween(startOfYear, endOfYear, 'day', '[]');
      });

      // Group by month (0 = Jan, 1 = Feb, ..., 11 = Dec)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const grouped = Array(12).fill(0);
      timeframeFiltered.forEach(t => {
        const monthIdx = dayjs(t.transactionDate).month();
        grouped[monthIdx] += t.amount;
      });

      chartData = months.map((month, idx) => ({
        value: grouped[idx],
        label: month,
      }));

    } else if (timeframe === 'YEAR') {
      title = 'Yearly Spending (5 Year Trend)';
      const currentYear = now.year();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i); // Last 5 years

      timeframeFiltered = typeFiltered.filter(t => {
        const y = dayjs(t.transactionDate).year();
        return y >= years[0] && y <= years[4];
      });

      const grouped = {};
      years.forEach(yr => { grouped[yr] = 0; });
      timeframeFiltered.forEach(t => {
        const y = dayjs(t.transactionDate).year();
        if (grouped[y] !== undefined) {
          grouped[y] += t.amount;
        }
      });

      chartData = years.map(yr => ({
        value: grouped[yr],
        label: String(yr),
      }));
    }

    // Ensure chartData values are valid numbers (gifted-charts crashes on NaN/undefined)
    chartData = chartData.map(item => ({
      ...item,
      value: isNaN(item.value) || item.value < 0 ? 0 : item.value,
    }));

    // Calculate total & average
    const total = timeframeFiltered.reduce((sum, t) => sum + t.amount, 0);
    const average = chartData.length > 0 ? total / chartData.length : 0;

    // Category Breakdown calculations
    const catGroups = {};
    timeframeFiltered.forEach(t => {
      const cat = t.category || 'Others';
      catGroups[cat] = (catGroups[cat] || 0) + t.amount;
    });

    const categoryBreakdown = Object.keys(catGroups)
      .map((name, index) => {
        const amt = catGroups[name];
        const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
        return {
          name,
          amount: amt,
          percentage: pct,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Format category data for PieChart
    const pieData = categoryBreakdown.length > 0
      ? categoryBreakdown.map(c => ({
          value: c.percentage || 1,
          color: c.color,
          name: c.name,
          text: `${c.percentage}%`,
        }))
      : [{ value: 100, color: colors.divider, name: 'No data', text: '0%' }];

    return {
      chartData,
      timeframeFiltered,
      total,
      average,
      categoryBreakdown,
      pieData,
      title,
    };
  }, [transactions, activeTab, timeframe]);

  // ─────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Analytics</Text>
      <View style={styles.headerSubtitleBox}>
        <Icon name="analytics-outline" size={16} color={colors.primary} />
        <Text style={styles.headerSubtitle}>Real-time Insights</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Toggle Selector for Expenses vs Income */}
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'EXPENSES' ? styles.activeToggleTab : null]}
            onPress={() => setActiveTab('EXPENSES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeTab === 'EXPENSES' ? styles.activeToggleTabText : null]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'INCOME' ? styles.activeToggleTab : null]}
            onPress={() => setActiveTab('INCOME')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeTab === 'INCOME' ? styles.activeToggleTabText : null]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeframe Selector Pill Row */}
        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf.key}
              style={[
                styles.timeframeTab,
                timeframe === tf.key ? styles.activeTimeframeTab : null
              ]}
              onPress={() => setTimeframe(tf.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeframeTabText,
                  timeframe === tf.key ? styles.activeTimeframeTabText : null
                ]}
              >
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spending Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{analyticsData.title}</Text>
          <Card style={styles.chartCard}>
            <LineChart
              data={analyticsData.chartData}
              width={SCREEN_WIDTH - 64}
              height={180}
              color={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              thickness={3}
              startFillColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              endFillColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              startOpacity={0.2}
              endOpacity={0.0}
              initialSpacing={16}
              noOfSections={4}
              rulesColor={colors.divider}
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              hideDataPoints={false}
              dataPointsColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              dataPointsRadius={4}
              curved
            />
          </Card>
        </View>

        {/* Insights/Totals Row Cards */}
        <View style={styles.insightsRow}>
          <Card style={styles.insightBox}>
            <Text style={styles.insightLabel}>Total {activeTab === 'EXPENSES' ? 'Spent' : 'Earned'}</Text>
            <Text style={[styles.insightValue, { color: activeTab === 'EXPENSES' ? colors.danger : colors.success }]}>
              {formatCurrency(analyticsData.total)}
            </Text>
          </Card>
          <Card style={styles.insightBox}>
            <Text style={styles.insightLabel}>Average ({timeframe.toLowerCase()})</Text>
            <Text style={styles.insightValue}>
              {formatCurrency(analyticsData.average)}
            </Text>
          </Card>
        </View>

        {/* Category Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <Card style={styles.pieCard}>
            <View style={styles.pieContainer}>
              <PieChart
                data={analyticsData.pieData}
                donut
                radius={76}
                innerRadius={52}
                innerCircleColor={colors.card}
                showText={false}
              />
              <View style={styles.pieCenterTextContainer}>
                <Text style={styles.pieCenterTotal}>
                  {formatCurrency(analyticsData.total)}
                </Text>
                <Text style={styles.pieCenterLabel}>Total</Text>
              </View>
            </View>

            {/* Custom Pie Legend table */}
            <View style={styles.legendContainer}>
              {analyticsData.categoryBreakdown.length > 0 ? (
                analyticsData.categoryBreakdown.slice(0, 5).map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendValue}>{item.percentage}%</Text>
                      <Text style={styles.legendAmt}>{formatCurrency(item.amount)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noLegendText}>No transactions in this period</Text>
              )}
            </View>
          </Card>
        </View>

        {/* Bottom spacer */}
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
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerSubtitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.primary + '12',
    borderRadius: radius.full,
  },
  headerSubtitle: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleTab: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggleTab: {
    backgroundColor: colors.secondary,
  },
  toggleTabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  activeToggleTabText: {
    color: colors.text.primary,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  timeframeTab: {
    flex: 1,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTimeframeTab: {
    backgroundColor: colors.primary,
  },
  timeframeTabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeTimeframeTabText: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chartCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  axisText: {
    color: colors.text.muted,
    fontSize: 9,
    fontWeight: '500',
  },
  insightsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  insightBox: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pieCard: {
    padding: spacing.md,
    flexDirection: 'column',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  pieCenterTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieCenterTotal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pieCenterLabel: {
    fontSize: 9,
    color: colors.text.muted,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  legendAmt: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    width: 65,
    textAlign: 'right',
  },
  noLegendText: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginVertical: spacing.md,
  },
});

export default AnalyticsScreen;
