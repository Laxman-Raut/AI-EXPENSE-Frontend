import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Ionicons';

import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/Card/GlassCard';
import Loader from '../../components/Loader/Loader';
import { useTransactions } from '../../hooks/useTransactions';
import { Colors, Spacing, Typography } from '../../theme';
import useAppStore from '../../store/useAppStore';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS = {
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

const getCategoryIcon = (category) => {
  const key = category ? category.toLowerCase() : 'default';
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
};

const getCategoryColor = (category) => {
  const key = category ? category.toLowerCase() : 'default';
  const colors = {
    food: '#EC4899',
    transport: '#06B6D4',
    shopping: '#F59E0B',
    entertainment: '#8B5CF6',
    health: '#EF4444',
    bills: '#3B82F6',
    salary: '#10B981',
    freelance: '#10B981',
    default: '#64748B',
  };
  return colors[key] || colors.default;
};

const CalendarViewScreen = ({ navigation }) => {
  const theme = useAppStore((state) => state.theme);
  const currency = useAppStore((state) => state.currency);
  const isDark = theme === 'dark';

  const { data: transactions, isLoading } = useTransactions();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Group transactions by date string (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};
    const groups = {};
    transactions.forEach((txn) => {
      if (!txn.transactionDate) return;
      const dateStr = dayjs(txn.transactionDate).format('YYYY-MM-DD');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(txn);
    });
    return groups;
  }, [transactions]);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  // Generate grid cells
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = currentMonth.startOf('month').day();

  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ id: `empty-${i}`, isPlaceholder: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = currentMonth.date(i);
    cells.push({
      id: `day-${i}`,
      date,
      dayNum: i,
      isPlaceholder: false,
    });
  }

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const dayTransactions = groupedTransactions[selectedDateStr] || [];

  const renderTransactionItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const catColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={[
          styles.txnCard,
          {
            backgroundColor: isDark ? (Colors.surface || '#0A0E1A') : '#FFFFFF',
            borderColor: isDark ? (Colors.border || 'rgba(138, 63, 252, 0.15)') : '#E2E8F0',
          },
        ]}
        onPress={() => navigation.navigate('TransactionDetail', { id: item._id })}
        activeOpacity={0.7}>
        <View style={styles.txnLeft}>
          <View style={[styles.iconBg, { backgroundColor: catColor + '15' }]}>
            <Icon name={getCategoryIcon(item.category)} size={22} color={catColor} />
          </View>
          <View style={styles.txnMeta}>
            <Text style={[styles.txnTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {item.description || 'Transaction'}
            </Text>
            <View style={styles.txnSubRow}>
              <Text style={[styles.txnCategory, { color: catColor }]}>{item.category}</Text>
              <Text style={[styles.txnDot, { color: isDark ? '#6B6E8A' : '#94A3B8' }]}>•</Text>
              <Text style={[styles.txnPayment, { color: isDark ? '#A0A3BD' : '#64748B' }]}>{item.paymentMethod}</Text>
            </View>
          </View>
        </View>
        <View style={styles.txnRight}>
          <Text
            style={[
              styles.txnAmount,
              { color: isExpense ? (Colors.expense || '#EF4444') : (Colors.income || '#22C55E') },
            ]}>
            {isExpense ? '-' : '+'}{currency}
            {Number(item.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loader message="Analyzing transaction records..." />;
  }

  return (
    <GradientBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back-outline" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>Calendar Ledger</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarSection}>
          <GlassCard style={styles.calendarCard}>
            {/* Month Navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Icon name="chevron-back-outline" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {currentMonth.format('MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Icon name="chevron-forward-outline" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Weekday Names */}
            <View style={styles.weekdaysContainer}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.grid}>
              {cells.map((cell) => {
                if (cell.isPlaceholder) {
                  return <View key={cell.id} style={styles.cell} />;
                }

                const cellDateStr = cell.date.format('YYYY-MM-DD');
                const isSelected = selectedDate.isSame(cell.date, 'day');
                const isToday = dayjs().isSame(cell.date, 'day');

                // Check transactions for indicators
                const txns = groupedTransactions[cellDateStr] || [];
                const hasIncome = txns.some((t) => t.type === 'income');
                const hasExpense = txns.some((t) => t.type === 'expense');

                return (
                  <TouchableOpacity
                    key={cell.id}
                    style={[
                      styles.cell,
                      isSelected && styles.selectedCell,
                      isToday && !isSelected && styles.todayCell,
                    ]}
                    onPress={() => setSelectedDate(cell.date)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.cellText,
                        isSelected && styles.selectedCellText,
                        isToday && !isSelected && styles.todayCellText,
                      ]}>
                      {cell.dayNum}
                    </Text>
                    {/* Indicators */}
                    <View style={styles.indicatorContainer}>
                      {hasIncome && (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: isSelected ? '#FFFFFF' : (Colors.income || '#22C55E') },
                          ]}
                        />
                      )}
                      {hasExpense && (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: isSelected ? '#FFFFFF' : (Colors.expense || '#EF4444') },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </View>

        {/* Selected Day Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {selectedDate.isSame(dayjs(), 'day') ? 'Today' : selectedDate.format('DD MMMM YYYY')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {dayTransactions.length} {dayTransactions.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        {/* Selected Day Transactions List */}
        <FlatList
          data={dayTransactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="calendar-clear-outline" size={48} color={isDark ? '#3E4260' : '#CBD5E1'} />
              <Text style={[styles.emptyText, { color: isDark ? '#A0A3BD' : '#64748B' }]}>
                No activities logged on this date.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base || 16,
    paddingVertical: Spacing.sm || 8,
  },
  backBtn: {
    padding: Spacing.sm || 8,
  },
  title: {
    ...Typography.h3,
    fontWeight: '700',
  },
  calendarSection: {
    paddingHorizontal: Spacing.base || 16,
    marginVertical: Spacing.sm || 8,
  },
  calendarCard: {
    padding: Spacing.base || 16,
    borderRadius: Spacing.borderRadius || 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base || 16,
  },
  navBtn: {
    padding: Spacing.sm || 8,
    borderRadius: Spacing.borderRadiusSmall || 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  monthLabel: {
    ...Typography.subtitle,
    fontWeight: '700',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Spacing.xs || 4,
    marginBottom: Spacing.xs || 4,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    ...Typography.caption,
    color: Colors.textMuted || '#64748B',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 1,
    paddingTop: 4,
  },
  cellText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary || '#94A3B8',
    fontWeight: '600',
  },
  selectedCell: {
    backgroundColor: Colors.primary || '#8A3FFC',
  },
  selectedCellText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: Colors.primaryLight || '#A767FF',
  },
  todayCellText: {
    color: Colors.primaryLight || '#A767FF',
    fontWeight: '700',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 4,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.base || 16,
    marginTop: Spacing.md || 12,
    marginBottom: Spacing.sm || 8,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted || '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.base || 16,
    paddingBottom: Spacing.xl || 24,
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base || 16,
    borderRadius: Spacing.borderRadius || 16,
    marginBottom: Spacing.sm || 8,
    borderWidth: 1,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base || 16,
  },
  txnMeta: {
    flex: 1,
  },
  txnTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  txnSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  txnCategory: {
    ...Typography.caption,
    fontWeight: '600',
  },
  txnDot: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  txnPayment: {
    ...Typography.caption,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    ...Typography.body,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl || 40,
  },
  emptyText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm || 8,
    textAlign: 'center',
  },
});

export default CalendarViewScreen;
