import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import GradientBackground from '../../components/common/GradientBackground';
import {
  fetchCategoryAnalytics,
  fetchAnalyticsReport,
  fetchBudgetUtilization,
  CategoryAnalytic,
} from '../../api/analytics';
import useAppStore from '../../store/useAppStore';
import { Colors } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock calendar days (consistent with Expenses screen)
const CALENDAR_DAYS = [
  { dayName: 'M', dayNum: 20 },
  { dayName: 'T', dayNum: 21 },
  { dayName: 'W', dayNum: 22 },
  { dayName: 'T', dayNum: 23 },
  { dayName: 'F', dayNum: 24, isSelected: true },
  { dayName: 'S', dayNum: 25 },
  { dayName: 'S', dayNum: 26 },
];

const MOCK_ANALYTICS = [
  { category: 'Shopping', amount: 3762, percentage: 45, color: '#FF6037' },
  { category: 'Food And Drinks', amount: 4672, percentage: 35, color: '#1C1E3A' },
  { category: 'Healthcare', amount: 2917, percentage: 20, color: '#8A3FFC' },
];

const CATEGORY_COLORS = ['#FF6037', '#1C1E3A', '#8A3FFC', '#06B6D4', '#8B5CF6', '#10B981'];

const AnalyticsScreen: React.FC<any> = ({ navigation }) => {
  const theme = useAppStore((state) => state.theme);
  const storedBudget = useAppStore((state) => state.monthlyBudget);
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryAnalytic[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState(24);

  const loadData = useCallback(async () => {
    try {
      const cats = await fetchCategoryAnalytics('monthly');
      if (cats?.success) {
        setCategoryData(cats.data ?? []);
      }
    } catch (err) {
      console.error('[Analytics] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Process data for chart
  const processedData = useMemo(() => {
    if (categoryData.length === 0) {
      return MOCK_ANALYTICS;
    }

    const total = categoryData.reduce((s, c) => s + (c.amount || 0), 0);
    if (total === 0) return MOCK_ANALYTICS;

    return categoryData.map((item, index) => {
      const percentage = Math.round((item.amount / total) * 100);
      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      
      // Clean display name
      const displayName = item.category.charAt(0).toUpperCase() + item.category.slice(1);
      
      return {
        category: displayName,
        amount: item.amount,
        percentage,
        color,
      };
    });
  }, [categoryData]);

  const totalSpent = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.amount, 0);
  }, [processedData]);

  // Donut chart drawing helpers
  const radius = 50;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius; // ~314.159

  // Calculate cumulative strokeDashoffsets for SVG paths
  let cumulativePercent = 0;

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6037" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Total Expense</Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icon name="notifications-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6037"
              colors={['#FF6037']}
            />
          }
          contentContainerStyle={styles.scrollContent}>

          {/* Calendar Strip */}
          <View style={styles.calendarStripContainer}>
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity>
                <Icon name="chevron-back" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>April 2022</Text>
              <TouchableOpacity>
                <Icon name="chevron-forward" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.daysRow}>
              {CALENDAR_DAYS.map((day, idx) => {
                const isSelected = selectedDayNum === day.dayNum;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedDayNum(day.dayNum)}
                    style={[
                      styles.dayCell,
                      isSelected ? styles.dayCellSelected : null,
                    ]}>
                    <Text style={[styles.dayNameText, isSelected ? styles.dayNameSelectedText : null]}>
                      {day.dayName}
                    </Text>
                    <Text style={[styles.dayNumText, isSelected ? styles.dayNumSelectedText : null]}>
                      {day.dayNum}
                    </Text>
                    {isSelected && <View style={styles.dayDotSelected} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Highlights Spend Card */}
          <View style={styles.highlightCardContainer}>
            <View style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <Text style={styles.highlightText}>
                  You have Spend <Text style={styles.highlightAmount}>{formatCurrency(totalSpent || 6584)}</Text>
                </Text>
                <Text style={styles.highlightSubtext}>this month.</Text>
              </View>
              <Text style={styles.highlightDate}>April, 2022</Text>

              {/* Stacked Progress Bar showing 75.78% spent vs 24.22% left */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarTrack, { backgroundColor: '#F1F3F9' }]}>
                  <View style={[styles.progressBarFill, { width: '75.78%', backgroundColor: '#8A3FFC' }]}>
                    <Text style={styles.progressBarText}>75.78%</Text>
                  </View>
                  <View style={styles.progressBarRemainingContainer}>
                    <Text style={styles.progressBarRemainingText}>24.22%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Analytics Section */}
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.analyticsContentCard}>
              {/* Donut Chart using SVG */}
              <View style={styles.chartWrapper}>
                <View style={styles.svgContainer}>
                  <Svg width={180} height={180} viewBox="0 0 140 140">
                    <Circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="#F1F3F9"
                      strokeWidth={strokeWidth}
                    />
                    {processedData.map((item, idx) => {
                      const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
                      const rotation = (cumulativePercent / 100) * 360 - 90;
                      cumulativePercent += item.percentage;

                      return (
                        <Circle
                          key={idx}
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          transform={`rotate(${rotation} 70 70)`}
                        />
                      );
                    })}
                  </Svg>
                  {/* Text inside the donut */}
                  <View style={styles.donutCenterText}>
                    <Text style={styles.centerTextValue}>35%</Text>
                    <Text style={styles.centerTextLabel}>Food</Text>
                  </View>
                </View>
              </View>

              {/* Legends & Details list */}
              <View style={styles.legendContainer}>
                {processedData.map((item, idx) => (
                  <View key={idx} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View>
                        <Text style={styles.legendCategoryName}>{item.category}</Text>
                        <Text style={styles.legendAmountValue}>{formatCurrency(item.amount)}</Text>
                      </View>
                    </View>
                    <Text style={styles.legendPercentage}>{item.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  calendarStripContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    flex: 1,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#FF6037',
  },
  dayNameText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayNameSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayNumText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dayNumSelectedText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayDotSelected: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 6,
  },
  highlightCardContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  highlightHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  highlightText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  highlightAmount: {
    color: '#FF6037', // red/orange spend text in mockup
    fontWeight: '700',
  },
  highlightSubtext: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  highlightDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  progressBarContainer: {
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  progressBarTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 16,
    borderRadius: 18,
  },
  progressBarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  progressBarRemainingContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  progressBarRemainingText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  analyticsSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  analyticsContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  svgContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  centerTextLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  legendContainer: {
    width: '100%',
    gap: 16,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  legendCategoryName: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  legendAmountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default AnalyticsScreen;
