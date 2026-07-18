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

const TIMEFRAMES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'];

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
  const [timeframe, setTimeframe] = useState('1M');

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

    if (timeframe === '1D') {
      title = 'Today';
      const startOfToday = now.startOf('day');
      const endOfToday = now.endOf('day');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isSame(now, 'day');
      });

      const hours = Array.from({ length: 12 }, (_, i) => i * 2); // 0, 2, 4, 6, ..., 22
      const grouped = Array(12).fill(0);
      
      timeframeFiltered.forEach(t => {
        const hour = dayjs(t.transactionDate).hour();
        const intervalIdx = Math.floor(hour / 2);
        if (intervalIdx >= 0 && intervalIdx < 12) {
          grouped[intervalIdx] += t.amount;
        }
      });

      let runningSum = 0;
      chartData = hours.map((hour, idx) => {
        runningSum += grouped[idx];
        const timeLabel = dayjs().hour(hour).minute(0).format('hh:mm A');
        return {
          value: runningSum,
          label: idx % 3 === 0 ? dayjs().hour(hour).format('HH:mm') : '',
          dateStr: dayjs().format('DD MMM YYYY'),
          timeStr: timeLabel,
        };
      });

    } else if (timeframe === '5D') {
      title = 'Last 5 Days';
      const startOf5Days = now.subtract(4, 'day').startOf('day');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isAfter(startOf5Days) || d.isSame(startOf5Days, 'day');
      });

      const days = Array.from({ length: 5 }, (_, i) => now.subtract(4 - i, 'day'));
      const grouped = Array(5).fill(0);

      timeframeFiltered.forEach(t => {
        const tDate = dayjs(t.transactionDate);
        const dayIdx = days.findIndex(d => d.isSame(tDate, 'day'));
        if (dayIdx !== -1) {
          grouped[dayIdx] += t.amount;
        }
      });

      chartData = days.map((day, idx) => ({
        value: grouped[idx],
        label: day.format('DD MMM'),
        dateStr: day.format('DD MMMM YYYY'),
        timeStr: '',
      }));

    } else if (timeframe === '1M') {
      title = 'Last 30 Days';
      const startOf30Days = now.subtract(29, 'day').startOf('day');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isAfter(startOf30Days) || d.isSame(startOf30Days, 'day');
      });

      const days = Array.from({ length: 30 }, (_, i) => now.subtract(29 - i, 'day'));
      const grouped = Array(30).fill(0);

      timeframeFiltered.forEach(t => {
        const tDate = dayjs(t.transactionDate);
        const dayIdx = days.findIndex(d => d.isSame(tDate, 'day'));
        if (dayIdx !== -1) {
          grouped[dayIdx] += t.amount;
        }
      });

      chartData = days.map((day, idx) => ({
        value: grouped[idx],
        label: idx % 6 === 0 ? day.format('DD MMM') : '',
        dateStr: day.format('DD MMMM YYYY'),
        timeStr: '',
      }));

    } else if (timeframe === '6M') {
      title = 'Last 6 Months';
      const startOf6Months = now.subtract(5, 'month').startOf('month');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isAfter(startOf6Months) || d.isSame(startOf6Months, 'month');
      });

      const months = Array.from({ length: 6 }, (_, i) => now.subtract(5 - i, 'month'));
      const grouped = Array(6).fill(0);

      timeframeFiltered.forEach(t => {
        const tDate = dayjs(t.transactionDate);
        const monthIdx = months.findIndex(m => m.isSame(tDate, 'month'));
        if (monthIdx !== -1) {
          grouped[monthIdx] += t.amount;
        }
      });

      chartData = months.map((month, idx) => ({
        value: grouped[idx],
        label: month.format('MMM'),
        dateStr: month.format('MMMM YYYY'),
        timeStr: '',
      }));

    } else if (timeframe === 'YTD') {
      title = 'Year to Date';
      const startOfYear = now.startOf('year');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isAfter(startOfYear) || d.isSame(startOfYear, 'day');
      });

      const currentMonth = now.month();
      const months = Array.from({ length: currentMonth + 1 }, (_, i) => now.month(i));
      const grouped = Array(currentMonth + 1).fill(0);

      timeframeFiltered.forEach(t => {
        const tDate = dayjs(t.transactionDate);
        if (tDate.year() === now.year()) {
          const mIdx = tDate.month();
          if (mIdx < grouped.length) {
            grouped[mIdx] += t.amount;
          }
        }
      });

      chartData = months.map((month, idx) => ({
        value: grouped[idx],
        label: month.format('MMM'),
        dateStr: month.format('MMMM YYYY'),
        timeStr: '',
      }));

    } else if (timeframe === '1Y') {
      title = 'Last 12 Months';
      const startOf12Months = now.subtract(11, 'month').startOf('month');

      timeframeFiltered = typeFiltered.filter(t => {
        const d = dayjs(t.transactionDate);
        return d.isAfter(startOf12Months) || d.isSame(startOf12Months, 'month');
      });

      const months = Array.from({ length: 12 }, (_, i) => now.subtract(11 - i, 'month'));
      const grouped = Array(12).fill(0);

      timeframeFiltered.forEach(t => {
        const tDate = dayjs(t.transactionDate);
        const monthIdx = months.findIndex(m => m.isSame(tDate, 'month'));
        if (monthIdx !== -1) {
          grouped[monthIdx] += t.amount;
        }
      });

      chartData = months.map((month, idx) => ({
        value: grouped[idx],
        label: idx % 3 === 0 ? month.format('MMM') : '',
        dateStr: month.format('MMMM YYYY'),
        timeStr: '',
      }));

    } else if (timeframe === '5Y') {
      title = 'Last 5 Years';
      const currentYear = now.year();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

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
        dateStr: `Year ${yr}`,
        timeStr: '',
      }));
    }

    // Realistic Mock Fallback Generator if there's no transaction data in this period
    const hasData = timeframeFiltered.length > 0;

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
    const breakDownSource = hasData ? timeframeFiltered : [];
    breakDownSource.forEach(t => {
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
      hasData,
    };
  }, [transactions, activeTab, timeframe]);

  // Calculate precise spacing to fit the LineChart exactly within container width (taking padding into account)
  const chartWidth = SCREEN_WIDTH - 48; // Card inner width (SCREEN_WIDTH - card margins 32 - card paddings 16)
  const yAxisLabelWidth = 35;
  const initialSpacing = 10;
  const endSpacing = 10;
  const gridWidth = chartWidth - yAxisLabelWidth - initialSpacing - endSpacing - 10; // 10px right safety margin

  const chartSpacing = useMemo(() => {
    const N = analyticsData.chartData.length;
    if (N <= 1) return 0;
    return gridWidth / (N - 1);
  }, [analyticsData.chartData, gridWidth]);

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
            style={[styles.toggleTab, activeTab === 'EXPENSES' ? styles.activeExpenseTab : null]}
            onPress={() => setActiveTab('EXPENSES')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeTab === 'EXPENSES' ? styles.activeExpenseTabText : null]}>
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, activeTab === 'INCOME' ? styles.activeIncomeTab : null]}
            onPress={() => setActiveTab('INCOME')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeTab === 'INCOME' ? styles.activeIncomeTabText : null]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeframe Selector Pill Row */}
        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeTab,
                  isActive ? styles.activeTimeframeTab : null
                ]}
                onPress={() => setTimeframe(tf)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeframeTabText,
                    isActive ? styles.activeTimeframeTabText : null
                  ]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spending Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{analyticsData.title}</Text>
          <Card style={styles.chartCard}>
            <LineChart
              data={analyticsData.chartData}
              width={gridWidth}
              height={180}
              color={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              thickness={3}
              startFillColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              endFillColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              startOpacity={0.25}
              endOpacity={0.01}
              initialSpacing={initialSpacing}
              endSpacing={endSpacing}
              spacing={chartSpacing}
              noOfSections={4}
              rulesColor="rgba(255, 255, 255, 0.04)"
              rulesType="solid"
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisLabelWidth={yAxisLabelWidth}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              hideDataPoints={true}
              curved
              overflowTop={35}
              overflowBottom={15}
              animateOnDataChange
              animationDuration={600}
              
              // 1. DIRECT PROPS (destructured by some versions of the library components)
              showPointerStrip={true}
              pointerStripWidth={1.5}
              pointerStripColor={activeTab === 'EXPENSES' ? 'rgba(255, 77, 103, 0.35)' : 'rgba(0, 210, 106, 0.35)'}
              pointerStripUptoDataPoint={false}
              pointerColor={activeTab === 'EXPENSES' ? colors.danger : colors.success}
              pointerRadius={6}
              pointerWidth={2}
              activatePointersOnLongPress={false}
              activatePointersInstantlyOnTouch={true}
              pointerLabelWidth={130}
              pointerLabelHeight={64}
              shiftPointerLabelX={-65}
              shiftPointerLabelY={-74}
              pointerLabelComponent={(items) => {
                if (!items || items.length === 0) return null;
                const item = items[0];
                if (!item || item.value === undefined) return null;
                return (
                  <View style={styles.tooltipContainer}>
                    <Text style={styles.tooltipAmount}>{formatCurrency(item.value)}</Text>
                    <Text style={styles.tooltipDate}>{item.dateStr || item.label}</Text>
                    {item.timeStr ? <Text style={styles.tooltipTime}>{item.timeStr}</Text> : null}
                  </View>
                );
              }}
              
              // 2. POINTERCONFIG PROP OBJECT (required by other versions to attach touch listeners)
              pointerConfig={{
                showPointerStrip: true,
                pointerStripWidth: 1.5,
                pointerStripColor: activeTab === 'EXPENSES' ? 'rgba(255, 77, 103, 0.35)' : 'rgba(0, 210, 106, 0.35)',
                pointerStripUptoPoint: false,
                pointerColor: activeTab === 'EXPENSES' ? colors.danger : colors.success,
                pointerRadius: 6,
                pointerWidth: 2,
                activatePointersOnLongPress: false,
                activatePointersInstantlyOnTouch: true,
                pointerLabelWidth: 130,
                pointerLabelHeight: 64,
                shiftPointerLabelX: -65,
                shiftPointerLabelY: -74,
                pointerLabelComponent: (items) => {
                  if (!items || items.length === 0) return null;
                  const item = items[0];
                  if (!item || item.value === undefined) return null;
                  return (
                    <View style={styles.tooltipContainer}>
                      <Text style={styles.tooltipAmount}>{formatCurrency(item.value)}</Text>
                      <Text style={styles.tooltipDate}>{item.dateStr || item.label}</Text>
                      {item.timeStr ? <Text style={styles.tooltipTime}>{item.timeStr}</Text> : null}
                    </View>
                  );
                }
              }}
            />
            {!analyticsData.hasData && (
              <View style={styles.noDataOverlay} pointerEvents="none">
                <Text style={styles.noDataText}>No Data Available</Text>
              </View>
            )}
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

        {/* Bottom spacer for breathing room */}
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
  toggleTabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  activeExpenseTab: {
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  activeExpenseTabText: {
    color: colors.danger,
  },
  activeIncomeTab: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  activeIncomeTabText: {
    color: colors.success,
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
  tooltipContainer: {
    backgroundColor: 'rgba(18, 19, 26, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  tooltipAmount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tooltipDate: {
    color: colors.text.secondary,
    fontSize: 9,
    fontWeight: '600',
  },
  tooltipTime: {
    color: colors.text.muted,
    fontSize: 8,
    fontWeight: '500',
    marginTop: 1,
  },
  noDataOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  noDataText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
});

export default AnalyticsScreen;
