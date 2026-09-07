import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency, getStoredAmountForCurrency } from '../../utils/formatCurrency';
import { useTransactions } from '../../hooks/useTransactions';
import useBanks from '../../hooks/useBanks';
import BankLogo from '../../components/atoms/BankLogo';

dayjs.extend(isBetween);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'This Year' },
  { id: 'range', label: 'Date Range' },
  { id: 'all', label: 'All Time' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_PRESETS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'custom', label: 'Custom' },
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
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'today' | 'month' | 'year' | 'range' | 'all'
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs().subtract(29, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(dayjs().year());
  const [isDateRangeModalVisible, setIsDateRangeModalVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(dayjs().subtract(29, 'day'));
  const [tempEndDate, setTempEndDate] = useState(dayjs());
  const [calMonth, setCalMonth] = useState(dayjs());
  const [activePreset, setActivePreset] = useState('30d');
  const [chartType, setChartType] = useState('expense'); // 'expense' | 'income'

  const userCurrency = useSelector((state) => state.auth?.user?.currency || state.app?.currency || 'INR');
  const { data: transactions = [], isLoading, refetch } = useTransactions(userCurrency);
  const { banks } = useBanks();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const openMonthPicker = () => {
    setPickerYear(selectedMonth.year());
    setIsMonthPickerVisible(true);
  };

  const openDateRangeModal = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setCalMonth(endDate || dayjs());
    setIsDateRangeModalVisible(true);
  };

  const handleSelectPreset = (presetId) => {
    setActivePreset(presetId);
    const now = dayjs();
    let s = now;
    let e = now;

    if (presetId === '7d') {
      s = now.subtract(6, 'day');
      e = now;
    } else if (presetId === '30d') {
      s = now.subtract(29, 'day');
      e = now;
    } else if (presetId === 'this_month') {
      s = now.startOf('month');
      e = now.endOf('month');
    } else if (presetId === 'last_month') {
      const prev = now.subtract(1, 'month');
      s = prev.startOf('month');
      e = prev.endOf('month');
    } else if (presetId === '90d') {
      s = now.subtract(89, 'day');
      e = now;
    } else {
      return;
    }

    setTempStartDate(s);
    setTempEndDate(e);
    setCalMonth(e);
  };

  const handleCalendarDayPress = (date) => {
    setActivePreset('custom');
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      if (date.isBefore(tempStartDate, 'day')) {
        setTempStartDate(date);
      } else {
        setTempEndDate(date);
      }
    }
  };

  const handleApplyDateRange = () => {
    if (tempStartDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate || tempStartDate);
    }
    setIsDateRangeModalVisible(false);
  };

  const calendarCells = useMemo(() => {
    const daysInM = calMonth.daysInMonth();
    const startDayOfWeek = calMonth.startOf('month').day();

    const cells = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ id: `empty-${i}`, isPlaceholder: true });
    }
    for (let i = 1; i <= daysInM; i++) {
      const date = calMonth.date(i);
      cells.push({
        id: `day-${i}`,
        date,
        dayNum: i,
        isPlaceholder: false,
      });
    }
    return cells;
  }, [calMonth]);

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
        return d.isSame(selectedMonth, 'month') && d.isSame(selectedMonth, 'year');
      }
      if (selectedPeriod === 'year') {
        return d.isSame(now, 'year');
      }
      if (selectedPeriod === 'range') {
        const start = startDate.startOf('day');
        const end = endDate.endOf('day');
        return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(end) || d.isSame(end, 'day'));
      }
      return true; // 'all'
    });
  }, [transactions, selectedPeriod, selectedMonth, startDate, endDate]);

  // ─────────────────────────────────────────────────────────────
  // 2. OVERVIEW STATS (Income, Expenses, Net Savings, Savings Rate)
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    periodFilteredTxns.forEach((t) => {
      const amt = getStoredAmountForCurrency(t, userCurrency);
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
  }, [periodFilteredTxns, userCurrency]);

  // ─────────────────────────────────────────────────────────────
  // 3. TREND LINE CHART DATA (Day / Month / Range / Year)
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
        hourTotals[idx] += getStoredAmountForCurrency(t, userCurrency);
      });
      points = hours.map((h, i) => ({
        value: hourTotals[i],
        label: `${h}:00`,
      }));
    } else if (selectedPeriod === 'month') {
      const daysInMonth = selectedMonth.daysInMonth();
      const interval = Math.max(1, Math.ceil(daysInMonth / 6));
      const dayTotals = {};
      filtered.forEach((t) => {
        const dayNum = dayjs(t.transactionDate || t.createdAt).date();
        dayTotals[dayNum] = (dayTotals[dayNum] || 0) + getStoredAmountForCurrency(t, userCurrency);
      });
      for (let d = 1; d <= daysInMonth; d += interval) {
        points.push({
          value: dayTotals[d] || 0,
          label: `${d} ${selectedMonth.format('MMM')}`,
        });
      }
    } else if (selectedPeriod === 'range') {
      const diffDays = Math.max(1, endDate.diff(startDate, 'day') + 1);
      if (diffDays <= 7) {
        for (let i = 0; i < diffDays; i++) {
          const currentDay = startDate.add(i, 'day');
          const dayTotal = filtered
            .filter((t) => dayjs(t.transactionDate || t.createdAt).isSame(currentDay, 'day'))
            .reduce((sum, t) => sum + getStoredAmountForCurrency(t, userCurrency), 0);
          points.push({
            value: dayTotal,
            label: currentDay.format('DD MMM'),
          });
        }
      } else if (diffDays <= 31) {
        const step = Math.max(1, Math.ceil(diffDays / 6));
        for (let i = 0; i < diffDays; i += step) {
          const slotStart = startDate.add(i, 'day');
          const slotEnd = startDate.add(Math.min(i + step - 1, diffDays - 1), 'day');
          const slotTotal = filtered
            .filter((t) => {
              const d = dayjs(t.transactionDate || t.createdAt);
              return (d.isAfter(slotStart, 'day') || d.isSame(slotStart, 'day')) &&
                     (d.isBefore(slotEnd, 'day') || d.isSame(slotEnd, 'day'));
            })
            .reduce((sum, t) => sum + getStoredAmountForCurrency(t, userCurrency), 0);
          points.push({
            value: slotTotal,
            label: slotStart.format('DD MMM'),
          });
        }
      } else {
        const startMonth = startDate.startOf('month');
        const totalMonths = Math.max(1, endDate.diff(startMonth, 'month') + 1);
        for (let m = 0; m < totalMonths; m++) {
          const targetMonth = startMonth.add(m, 'month');
          const monthTotal = filtered
            .filter((t) => dayjs(t.transactionDate || t.createdAt).isSame(targetMonth, 'month'))
            .reduce((sum, t) => sum + getStoredAmountForCurrency(t, userCurrency), 0);
          points.push({
            value: monthTotal,
            label: targetMonth.format('MMM YY'),
          });
        }
      }
    } else if (selectedPeriod === 'year') {
      const monthTotals = Array(12).fill(0);
      filtered.forEach((t) => {
        const m = dayjs(t.transactionDate || t.createdAt).month();
        monthTotals[m] += getStoredAmountForCurrency(t, userCurrency);
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
          monthTotals[idx] += getStoredAmountForCurrency(t, userCurrency);
        }
      });
      points = months.map((m, i) => ({
        value: monthTotals[i],
        label: m.format('MMM'),
      }));
    }

    const hasData = points.some((p) => p.value > 0);
    return { points, hasData };
  }, [periodFilteredTxns, selectedPeriod, selectedMonth, startDate, endDate, chartType, userCurrency]);

  // ─────────────────────────────────────────────────────────────
  // 4. CATEGORY BREAKDOWN (Where did money go / come from?)
  // ─────────────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const txns = periodFilteredTxns.filter((t) => t.type === chartType);
    const catMap = {};
    let totalCatAmount = 0;

    txns.forEach((t) => {
      const cat = t.category || 'Others';
      const amt = getStoredAmountForCurrency(t, userCurrency);
      catMap[cat] = (catMap[cat] || 0) + amt;
      totalCatAmount += amt;
    });

    const list = Object.keys(catMap)
      .map((cat, idx) => {
        const amt = catMap[cat];
        const pct = totalCatAmount > 0 ? Math.round((amt / totalCatAmount) * 100) : 0;
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

    return { list, pieData, totalCatAmount };
  }, [periodFilteredTxns, chartType, userCurrency]);

  // ─────────────────────────────────────────────────────────────
  // 5. OUTFLOW BANK BREAKDOWN (Money spent from which bank?)
  // ─────────────────────────────────────────────────────────────
  const outflowBankBreakdown = useMemo(() => {
    const expenses = periodFilteredTxns.filter((t) => t.type === 'expense');
    const bankMap = {};
    let totalOutflow = 0;

    expenses.forEach((t) => {
      const amt = getStoredAmountForCurrency(t, userCurrency);
      let bankName = 'Unlinked / Cash';
      let accNo = '';

      if (t.bankAccount) {
        if (typeof t.bankAccount === 'object') {
          bankName = t.bankAccount.nickname || t.bankAccount.bankName || 'Bank Account';
          accNo = t.bankAccount.accountNumber || '';
        } else if (banks && banks.length > 0) {
          const matchedBank = banks.find((b) => String(b._id) === String(t.bankAccount));
          if (matchedBank) {
            bankName = matchedBank.nickname || matchedBank.bankName || 'Bank Account';
            accNo = matchedBank.accountNumber || '';
          } else {
            bankName = 'Linked Bank';
          }
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
  }, [periodFilteredTxns, banks, userCurrency]);

  // ─────────────────────────────────────────────────────────────
  // 6. INFLOW BANK BREAKDOWN (Money received in which bank?)
  // ─────────────────────────────────────────────────────────────
  const inflowBankBreakdown = useMemo(() => {
    const incomes = periodFilteredTxns.filter((t) => t.type === 'income');
    const bankMap = {};
    let totalInflow = 0;

    incomes.forEach((t) => {
      const amt = getStoredAmountForCurrency(t, userCurrency);
      let bankName = 'Unlinked / Cash';
      let accNo = '';

      if (t.bankAccount) {
        if (typeof t.bankAccount === 'object') {
          bankName = t.bankAccount.nickname || t.bankAccount.bankName || 'Bank Account';
          accNo = t.bankAccount.accountNumber || '';
        } else if (banks && banks.length > 0) {
          const matchedBank = banks.find((b) => String(b._id) === String(t.bankAccount));
          if (matchedBank) {
            bankName = matchedBank.nickname || matchedBank.bankName || 'Bank Account';
            accNo = matchedBank.accountNumber || '';
          } else {
            bankName = 'Deposit Bank';
          }
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
  }, [periodFilteredTxns, banks, userCurrency]);

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
        {/* Period Selector Tabs (Today, Month, Year, Date Range, All Time) */}
        <View style={styles.periodPillContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodPillScroll}
          >
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
          </ScrollView>
        </View>

        {/* Month-Wise Filter Bar */}
        {selectedPeriod === 'month' && (
          <View style={styles.filterControlBar}>
            <TouchableOpacity
              style={styles.filterNavArrow}
              onPress={() => setSelectedMonth((prev) => prev.subtract(1, 'month'))}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterNavCenter}
              onPress={openMonthPicker}
              activeOpacity={0.8}
            >
              <Icon name="calendar-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.filterNavTitle}>
                {selectedMonth.format('MMMM YYYY')}
              </Text>
              <Icon name="chevron-down" size={14} color={colors.text.secondary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterNavArrow,
                selectedMonth.isSame(dayjs(), 'month') && selectedMonth.isSame(dayjs(), 'year') && styles.filterNavArrowDisabled,
              ]}
              onPress={() => setSelectedMonth((prev) => prev.add(1, 'month'))}
              activeOpacity={0.7}
            >
              <Icon
                name="chevron-forward"
                size={18}
                color={
                  selectedMonth.isSame(dayjs(), 'month') && selectedMonth.isSame(dayjs(), 'year')
                    ? colors.text.muted
                    : colors.text.primary
                }
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Date-Range Filter Bar */}
        {selectedPeriod === 'range' && (
          <TouchableOpacity
            style={styles.dateRangeControlBar}
            onPress={openDateRangeModal}
            activeOpacity={0.85}
          >
            <View style={styles.dateRangeLeft}>
              <View style={styles.dateRangeIconBox}>
                <Icon name="calendar" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dateRangeSub}>Selected Date Range</Text>
                <Text style={styles.dateRangeMain}>
                  {startDate.format('DD MMM YYYY')} — {endDate.format('DD MMM YYYY')}
                </Text>
              </View>
            </View>
            <View style={styles.dateRangeRight}>
              <View style={styles.dateRangeDaysBadge}>
                <Text style={styles.dateRangeDaysText}>
                  {Math.max(1, endDate.diff(startDate, 'day') + 1)} Days
                </Text>
              </View>
              <Icon name="pencil" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        )}

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
              {formatCurrency(stats.totalIncome, userCurrency)}
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
              {formatCurrency(stats.totalExpense, userCurrency)}
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
              {formatCurrency(stats.netSavings, userCurrency)}
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

        {/* Section 2: Category Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {chartType === 'expense'
              ? 'Where Did Money Go? (Category Expenses)'
              : 'Where Did Money Come From? (Category Income)'}
          </Text>
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
                    {formatCurrency(categoryBreakdown.totalCatAmount, userCurrency)}
                  </Text>
                  <Text style={styles.donutCenterSub}>
                    {chartType === 'expense' ? 'SPENT' : 'INCOME'}
                  </Text>
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
                  <Text style={styles.emptyLegendText}>
                    {chartType === 'expense' ? 'No expenses recorded' : 'No income recorded'}
                  </Text>
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
                    <Text style={styles.catBarAmt}>{formatCurrency(cat.amount, userCurrency)}</Text>
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
                        -{formatCurrency(bank.amount, userCurrency)}
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
                        +{formatCurrency(bank.amount, userCurrency)}
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

      {/* Month Picker Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsMonthPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.monthModalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation && e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Month</Text>
                <Text style={styles.modalSubtitle}>Filter analytics by specific month</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMonthPickerVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Year Navigator */}
            <View style={styles.yearNavRow}>
              <TouchableOpacity
                style={styles.yearNavBtn}
                onPress={() => setPickerYear((y) => y - 1)}
              >
                <Icon name="chevron-back" size={16} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.yearNavText}>{pickerYear}</Text>
              <TouchableOpacity
                style={styles.yearNavBtn}
                onPress={() => setPickerYear((y) => y + 1)}
              >
                <Icon name="chevron-forward" size={16} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* 12 Months Grid */}
            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((mName, idx) => {
                const isSelected = selectedMonth.year() === pickerYear && selectedMonth.month() === idx;
                const isCurrentMonth = dayjs().year() === pickerYear && dayjs().month() === idx;

                return (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthGridCell,
                      isSelected && styles.monthGridCellSelected,
                      isCurrentMonth && !isSelected && styles.monthGridCellToday,
                    ]}
                    onPress={() => {
                      setSelectedMonth(dayjs().year(pickerYear).month(idx));
                      setIsMonthPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthGridCellText,
                        isSelected && styles.monthGridCellTextSelected,
                        isCurrentMonth && !isSelected && styles.monthGridCellTextToday,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Button: Current Month */}
            <TouchableOpacity
              style={styles.modalQuickBtn}
              onPress={() => {
                setSelectedMonth(dayjs());
                setPickerYear(dayjs().year());
                setIsMonthPickerVisible(false);
              }}
            >
              <Text style={styles.modalQuickBtnText}>
                Reset to Current Month ({dayjs().format('MMM YYYY')})
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date Range Picker Modal */}
      <Modal
        visible={isDateRangeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDateRangeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.rangeModalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Date Range</Text>
                <Text style={styles.modalSubtitle}>
                  {tempStartDate ? tempStartDate.format('DD MMM YYYY') : 'Start date'}
                  {tempEndDate ? ` — ${tempEndDate.format('DD MMM YYYY')}` : ' — End date'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsDateRangeModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Presets Row */}
            <View style={styles.presetsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
                {DATE_PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetChip, isActive && styles.presetChipActive]}
                      onPress={() => handleSelectPreset(preset.id)}
                    >
                      <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Calendar Month Header */}
            <View style={styles.calHeader}>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={() => setCalMonth((m) => m.subtract(1, 'month'))}
              >
                <Icon name="chevron-back" size={16} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.calMonthText}>{calMonth.format('MMMM YYYY')}</Text>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={() => setCalMonth((m) => m.add(1, 'month'))}
              >
                <Icon name="chevron-forward" size={16} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calGrid}>
              {calendarCells.map((cell) => {
                if (cell.isPlaceholder) {
                  return <View key={cell.id} style={styles.calCell} />;
                }

                const isStart = tempStartDate && cell.date.isSame(tempStartDate, 'day');
                const isEnd = tempEndDate && cell.date.isSame(tempEndDate, 'day');
                const isSelected = isStart || isEnd;
                const isInRange =
                  tempStartDate &&
                  tempEndDate &&
                  cell.date.isAfter(tempStartDate, 'day') &&
                  cell.date.isBefore(tempEndDate, 'day');
                const isToday = cell.date.isSame(dayjs(), 'day');

                return (
                  <TouchableOpacity
                    key={cell.id}
                    style={[
                      styles.calCell,
                      isSelected && styles.calCellSelected,
                      isInRange && styles.calCellBetween,
                      isToday && !isSelected && !isInRange && styles.calCellToday,
                    ]}
                    onPress={() => handleCalendarDayPress(cell.date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calCellText,
                        isSelected && styles.calCellTextSelected,
                        isInRange && styles.calCellTextBetween,
                        isToday && !isSelected && !isInRange && styles.calCellTextToday,
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Range Summary & Footer Buttons */}
            <View style={styles.rangeModalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsDateRangeModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyDateRange}
              >
                <Text style={styles.applyBtnText}>
                  Apply Filter {tempStartDate && tempEndDate ? `(${Math.max(1, tempEndDate.diff(tempStartDate, 'day') + 1)}d)` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  periodPillContainer: {
    marginBottom: spacing.sm,
  },
  periodPillScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  periodPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  filterControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterNavArrow: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterNavArrowDisabled: {
    opacity: 0.4,
  },
  filterNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dateRangeControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.3)',
  },
  dateRangeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dateRangeIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRangeSub: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRangeMain: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  dateRangeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateRangeDaysBadge: {
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dateRangeDaysText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  monthModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  yearNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  yearNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearNavText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: spacing.md,
  },
  monthGridCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthGridCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthGridCellToday: {
    borderColor: colors.primary,
  },
  monthGridCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  monthGridCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthGridCellTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalQuickBtn: {
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.25)',
    alignItems: 'center',
  },
  modalQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  rangeModalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetsContainer: {
    marginBottom: spacing.sm,
  },
  presetsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  calCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  calCellBetween: {
    backgroundColor: 'rgba(138, 63, 252, 0.25)',
    borderRadius: 0,
  },
  calCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.5)',
    borderRadius: radius.full,
  },
  calCellText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  calCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calCellTextBetween: {
    color: colors.text.primary,
  },
  calCellTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  rangeModalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  applyBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
