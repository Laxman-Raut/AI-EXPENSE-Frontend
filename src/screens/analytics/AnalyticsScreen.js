import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useMonthlyAnalyticsData, useCategoryAnalyticsData } from '../../hooks/useAnalytics';
import { useTransactions } from '../../hooks/useTransactions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [activeTab, setActiveTab] = useState('EXPENSES'); // 'EXPENSES' | 'INCOME'

  // Fetch real analytics data
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyAnalyticsData('monthly');
  const { data: categoryData, isLoading: categoryLoading } = useCategoryAnalyticsData('monthly');
  const { data: transactions } = useTransactions();

  // Dynamic Line Chart Data for Spending Trend grouped in 4 weekly intervals
  const activeLineData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return [
        { value: 0, label: 'Wk 1' },
        { value: 0, label: 'Wk 2' },
        { value: 0, label: 'Wk 3' },
        { value: 0, label: 'Wk 4' },
      ];
    }

    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    monthlyData.forEach(item => {
      const day = item._id.day;
      const val = activeTab === 'EXPENSES' ? (item.expense || 0) : (item.income || 0);
      if (day <= 7) w1 += val;
      else if (day <= 14) w2 += val;
      else if (day <= 21) w3 += val;
      else w4 += val;
    });

    return [
      { value: w1, label: 'Wk 1' },
      { value: w2, label: 'Wk 2' },
      { value: w3, label: 'Wk 3' },
      { value: w4, label: 'Wk 4' },
    ];
  }, [monthlyData, activeTab]);

  // Dynamic Pie Chart Data for categories
  const activePieData = useMemo(() => {
    if (activeTab === 'INCOME') {
      if (!transactions || transactions.length === 0) {
        return [{ value: 100, color: colors.primary, text: '100%', name: 'Salary' }];
      }
      const incomes = transactions.filter(t => t.type === 'income');
      if (incomes.length === 0) {
        return [{ value: 100, color: colors.primary, text: '100%', name: 'Salary' }];
      }
      const total = incomes.reduce((sum, t) => sum + t.amount, 0);
      const groups = {};
      incomes.forEach(t => {
        const cat = t.category || 'Salary';
        groups[cat] = (groups[cat] || 0) + t.amount;
      });

      const colorsList = ['#8A3FFC', '#00D26A', '#FFB648', '#4B8CFF'];
      return Object.keys(groups).map((name, index) => {
        const amt = groups[name];
        const pct = Math.round((amt / total) * 100);
        return {
          value: pct,
          color: colorsList[index % colorsList.length],
          text: `${pct}%`,
          name,
        };
      });
    }

    if (!categoryData || categoryData.length === 0) {
      return [{ value: 100, color: colors.text.muted, text: '0%', name: 'No Expenses' }];
    }

    return categoryData.map(item => ({
      value: item.percentage || 1,
      color: item.color || colors.primary,
      text: `${item.percentage}%`,
      name: item.category,
    }));
  }, [categoryData, activeTab, transactions]);

  if (monthlyLoading || categoryLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Custom Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Analytics</Text>
      <TouchableOpacity style={styles.monthSelectPill} activeOpacity={0.7}>
        <Text style={styles.monthSelectText}>June 2025</Text>
        <Icon name="chevron-down" size={14} color={colors.text.secondary} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
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

        {/* Spending Trend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Trend</Text>
          <Card style={styles.chartCard}>
            <LineChart
              data={activeLineData}
              width={SCREEN_WIDTH - 64}
              height={180}
              color={colors.primary}
              thickness={3}
              startFillColor={colors.primary}
              endFillColor={colors.primary}
              startOpacity={0.2}
              endOpacity={0.0}
              initialSpacing={24}
              noOfSections={4}
              rulesColor={colors.divider}
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              curved
            />
          </Card>
        </View>

        {/* Category Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <Card style={styles.pieCard}>
            <View style={styles.pieContainer}>
              <PieChart
                data={activePieData}
                donut
                radius={76}
                innerRadius={52}
                innerCircleColor={colors.card}
                showText={false}
              />
            </View>

            {/* Custom Pie Legend table */}
            <View style={styles.legendContainer}>
              {activePieData.map((item) => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.name}</Text>
                  </View>
                  <Text style={styles.legendValue}>{item.text}</Text>
                </View>
              ))}
            </View>
          </Card>
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
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
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
  pieCard: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.1,
  },
  legendContainer: {
    flex: 1,
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
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  legendValue: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});

export default AnalyticsScreen;
