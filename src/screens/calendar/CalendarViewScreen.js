import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Header from '../../components/molecules/Header';
import TransactionItem from '../../components/molecules/TransactionItem';
import { colors, spacing, typography, radius } from '../../theme';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatCurrency';

const CalendarViewScreen = ({ navigation }) => {
  const { data: transactions, isLoading } = useTransactions();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(null);

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

  const handleDatePress = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date.isBefore(startDate, 'day')) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

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

  const dayTransactions = useMemo(() => {
    if (!transactions) return [];
    if (startDate && endDate) {
      return transactions.filter(t => {
        if (!t.transactionDate) return false;
        const tDate = dayjs(t.transactionDate);
        return (tDate.isAfter(startDate, 'day') || tDate.isSame(startDate, 'day')) &&
               (tDate.isBefore(endDate, 'day') || tDate.isSame(endDate, 'day'));
      });
    } else if (startDate) {
      return transactions.filter(t => {
        if (!t.transactionDate) return false;
        return dayjs(t.transactionDate).isSame(startDate, 'day');
      });
    }
    return transactions || [];
  }, [transactions, startDate, endDate]);

  const getListHeaderLabel = () => {
    if (startDate && endDate) {
      return `${startDate.format('DD MMM YYYY')} - ${endDate.format('DD MMM YYYY')}`;
    } else if (startDate) {
      return startDate.format('DD MMMM YYYY');
    }
    return 'All Time';
  };

  const renderHeader = () => (
    <Header
      title="Calendar Ledger"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Screen 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Month Navigation Control */}
        <View style={styles.calendarSection}>
          <Card style={styles.calendarCard}>
            <View style={styles.navRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <Icon name="chevron-back" size={16} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {currentMonth.format('MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <Icon name="chevron-forward" size={16} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekdays indicator Row */}
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
                const isSelected = startDate && startDate.isSame(cell.date, 'day');
                const isEndSelected = endDate && endDate.isSame(cell.date, 'day');
                const isRangeSelected = isSelected || isEndSelected;
                const isBetweenRange = startDate && endDate && cell.date.isAfter(startDate, 'day') && cell.date.isBefore(endDate, 'day');
                const isToday = dayjs().isSame(cell.date, 'day');

                // Check transactions indicators
                const txns = groupedTransactions[cellDateStr] || [];
                const hasIncome = txns.some((t) => t.type === 'income');
                const hasExpense = txns.some((t) => t.type === 'expense');

                return (
                  <TouchableOpacity
                    key={cell.id}
                    style={[
                      styles.cell,
                      isRangeSelected && styles.selectedCell,
                      isBetweenRange && styles.rangeBetweenCell,
                      isToday && !isRangeSelected && !isBetweenRange && styles.todayCell,
                    ]}
                    onPress={() => handleDatePress(cell.date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        isRangeSelected && styles.selectedCellText,
                        isBetweenRange && styles.rangeBetweenCellText,
                        isToday && !isRangeSelected && !isBetweenRange && styles.todayCellText,
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                    {/* Indicators */}
                    <View style={styles.indicatorContainer}>
                      {hasIncome && (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: isRangeSelected ? '#FFFFFF' : colors.success },
                          ]}
                        />
                      )}
                      {hasExpense && (
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: isRangeSelected ? '#FFFFFF' : colors.danger },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Selected Day Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {getListHeaderLabel()}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {dayTransactions.length} {dayTransactions.length === 1 ? 'record' : 'records'}
          </Text>
        </View>

        {/* Selected Day Transactions List */}
        <FlatList
          data={dayTransactions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="calendar-clear-outline" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>
                No activities logged on this date.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TransactionItem
              title={item.description}
              paymentMethod={item.paymentMethod}
              date={dayjs(item.transactionDate).format('hh:mm A')}
              amount={formatCurrency(item.amount)}
              type={item.type}
              onPress={() => navigation.navigate('TransactionDetail', { id: item._id })}
            />
          )}
        />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  calendarSection: {
    marginBottom: spacing.md,
  },
  calendarCard: {
    padding: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  monthLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.bold,
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
    borderRadius: radius.sm,
    marginVertical: 1,
    paddingTop: 4,
  },
  cellText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  selectedCell: {
    backgroundColor: colors.primary,
  },
  selectedCellText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  todayCellText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  rangeBetweenCell: {
    backgroundColor: colors.primary + '1F',
    borderRadius: radius.sm,
  },
  rangeBetweenCellText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
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
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyState: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});

export default CalendarViewScreen;
