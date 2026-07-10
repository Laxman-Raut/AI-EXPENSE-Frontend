import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import GradientBackground from '../../components/common/GradientBackground';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CustomAlert from '../../components/common/CustomAlert';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { Transaction } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate 7 days for the calendar strip
const CALENDAR_DAYS = [
  { dayName: 'M', dayNum: 20 },
  { dayName: 'T', dayNum: 21 },
  { dayName: 'W', dayNum: 22 },
  { dayName: 'T', dayNum: 23 },
  { dayName: 'F', dayNum: 24, isSelected: true }, // Highlighted in mockup
  { dayName: 'S', dayNum: 25 },
  { dayName: 'S', dayNum: 26 },
];

const CATEGORY_BUDGETS: Record<string, number> = {
  food: 3000,
  shopping: 2000,
  entertainment: 1500,
  transport: 1000,
  health: 2500,
  bills: 5000,
  default: 2000,
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'cart-outline', // mockup uses cart-outline for food/shopping style
  shopping: 'bag-handle-outline',
  health: 'heart-outline',
  default: 'ellipse-outline',
};

const TransactionsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const { data: transactions, isLoading: txLoading, refetch } = useTransactions();
  const { data: summary, refetch: refetchSummary } = useDashboardSummary();
  const deleteTransaction = useDeleteTransaction();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDayNum, setSelectedDayNum] = useState(24); // 24 is active in mockup

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetDesc, setDeleteTargetDesc] = useState('');

  const [infoAlertVisible, setInfoAlertVisible] = useState(false);
  const [infoAlertTitle, setInfoAlertTitle] = useState('');
  const [infoAlertMessage, setInfoAlertMessage] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSummary()]);
    setRefreshing(false);
  };

  const handleDelete = (id: string, description: string) => {
    setDeleteTargetId(id);
    setDeleteTargetDesc(description);
    setDeleteAlertVisible(true);
  };

  // Group transactions by category to calculate dynamic budget utilization
  const categorySpending = useMemo(() => {
    if (!transactions) return [];

    const spendingMap: Record<string, number> = {};
    transactions.forEach((t: Transaction) => {
      if (t.type === 'expense') {
        const cat = t.category.toLowerCase();
        spendingMap[cat] = (spendingMap[cat] || 0) + t.amount;
      }
    });

    const categories = Object.keys(spendingMap);
    if (categories.length === 0) {
      // Fallback mockup items if there's no data
      return [
        {
          id: 'mock-1',
          category: 'Food And Drinks',
          spent: 2486,
          budget: 3000,
          percentage: 75.78,
          icon: 'cart-outline',
          iconColor: '#FF6037',
        },
        {
          id: 'mock-2',
          category: 'Shopping',
          spent: 980,
          budget: 2000,
          percentage: 49.00,
          icon: 'bag-handle-outline',
          iconColor: '#8A3FFC',
        }
      ];
    }

    return categories.map((cat, index) => {
      const spent = spendingMap[cat];
      const budget = CATEGORY_BUDGETS[cat] || CATEGORY_BUDGETS.default;
      const percentage = Math.min((spent / budget) * 100, 100);
      const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
      
      return {
        id: cat,
        category: displayName,
        spent,
        budget,
        percentage: parseFloat(percentage.toFixed(2)),
        icon: CATEGORY_ICONS[cat] || CATEGORY_ICONS.default,
        iconColor: index % 2 === 0 ? '#FF6037' : '#8A3FFC',
      };
    });
  }, [transactions]);

  if (txLoading && !transactions) {
    return <LoadingSpinner message="Loading expenses..." />;
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <CustomAlert
          visible={deleteAlertVisible}
          title="Delete Transaction"
          message={`Are you sure you want to delete "${deleteTargetDesc}"?`}
          type="destructive"
          confirmText="Delete"
          onConfirm={() => {
            setDeleteAlertVisible(false);
            deleteTransaction.mutate(deleteTargetId);
          }}
          onCancel={() => setDeleteAlertVisible(false)}
        />
        <CustomAlert
          visible={infoAlertVisible}
          title={infoAlertTitle}
          message={infoAlertMessage}
          type="info"
          confirmText="OK"
          onConfirm={() => setInfoAlertVisible(false)}
          onCancel={() => setInfoAlertVisible(false)}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={styles.avatarButton}>
              <LinearGradient
                colors={['#8A3FFC', '#6D3BFF']}
                style={styles.avatarGradient}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expenses</Text>
            <TouchableOpacity style={styles.notificationBtn}>
              <Icon name="notifications-outline" size={24} color={Colors.textPrimary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Calendar Strip (April 2022 style) */}
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

          {/* Salary and Expense Side-by-Side Cards */}
          <View style={styles.summaryCardsRow}>
            {/* Total Salary Card */}
            <LinearGradient
              colors={['#6D3BFF', '#9E7BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardLabel}>Total Salary</Text>
                <TouchableOpacity>
                  <Icon name="ellipsis-vertical" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(summary?.totalIncome || 7000)}
              </Text>
              <View style={styles.cardInfoRow}>
                <Icon name="card-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.cardInfoText}>Bank Account **** 1965</Text>
              </View>
            </LinearGradient>

            {/* Total Expense Card */}
            <LinearGradient
              colors={['#FF5F38', '#FF8C68']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Text style={styles.summaryCardLabel}>Total Expense</Text>
                <TouchableOpacity>
                  <Icon name="ellipsis-vertical" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(summary?.totalExpense || 4543)}
              </Text>
              <View style={styles.cardInfoRow}>
                <Icon name="card-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.cardInfoText}>Bank Account **** 1965</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Expenses / Budgets List */}
          <View style={styles.expensesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AnalyticsTab')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {categorySpending.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.budgetCard}
                  activeOpacity={0.7}
                  onLongPress={() => {
                    if (typeof item.id === 'string' && !item.id.startsWith('mock')) {
                      setInfoAlertTitle('Category Info');
                      setInfoAlertMessage(`${item.category}: spent ${formatCurrency(item.spent)} of ${formatCurrency(item.budget)}`);
                      setInfoAlertVisible(true);
                    }
                  }}>
                  <View style={styles.budgetRow}>
                    {/* Orange shopping cart icon container */}
                    <View style={[styles.budgetIconContainer, { backgroundColor: item.iconColor + '15' }]}>
                      <Icon name={item.icon} size={22} color={item.iconColor} />
                    </View>

                    <View style={styles.budgetDetailsContainer}>
                      <View style={styles.budgetNameRow}>
                        <Text style={styles.budgetCategoryName}>{item.category}</Text>
                        <Text style={styles.budgetDateText}>April, 2022</Text>
                      </View>
                      <Text style={styles.budgetSubtext}>Credit Card</Text>

                      <View style={styles.budgetLimitsRow}>
                        <View>
                          <Text style={styles.limitLabel}>Total Spend</Text>
                          <Text style={styles.limitValueSpent}>{formatCurrency(item.spent)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-start', marginLeft: 32 }}>
                          <Text style={styles.limitLabel}>Total Budget</Text>
                          <Text style={styles.limitValueBudget}>{formatCurrency(item.budget)}</Text>
                        </View>
                        <Text style={[styles.percentageLabel, { color: item.iconColor }]}>
                          {item.percentage}%
                        </Text>
                      </View>

                      {/* Purple Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, { backgroundColor: '#F1F3F9' }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${item.percentage}%`, backgroundColor: '#8A3FFC' },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
    backgroundColor: '#FF6037', // Mockup highlighted orange
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
  summaryCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCardLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  summaryCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfoText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  expensesSection: {
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
  listContainer: {
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  budgetRow: {
    flexDirection: 'row',
  },
  budgetIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  budgetDetailsContainer: {
    flex: 1,
  },
  budgetNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  budgetDateText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  budgetSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  budgetLimitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    marginBottom: 10,
  },
  limitLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  limitValueSpent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981', // green for spent / progress
  },
  limitValueBudget: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  percentageLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default TransactionsScreen;
