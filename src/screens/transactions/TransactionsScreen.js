import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import TransactionCard from '../../components/molecules/TransactionCard';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatCurrency';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { useAlert } from '../../context/AlertContext';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';
import { useAuth } from '../../hooks/useAuth';

const FILTER_CHIPS = [
  'All',
  'Income',
  'Expense',
  'Food',
  'Shopping',
  'Bills',
  'Travel',
  'Salary',
  'Investments',
];

const formatDateGroup = (dateInput) => {
  const d = dayjs(dateInput);
  const today = dayjs();
  if (d.isSame(today, 'day')) return 'Today';
  if (d.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('DD MMMM YYYY');
};

const formatMobileDisplay = (mobile, email) => {
  if (mobile && mobile.trim()) {
    const raw = mobile.trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return raw;
  }
  if (email && email.trim()) {
    return email.trim();
  }
  return '+91 ••••• •••••';
};

const TransactionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data: transactions, isLoading: txLoading, refetch } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const { showAlert } = useAlert();
  const { checkAccessAndExecute } = usePremiumAccess();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Custom Filter Modal sheet states
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'amount_high' | 'amount_low'
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All'); // 'All' | 'UPI' | 'Card' | 'Cash' | 'Bank Transfer'
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time'); // 'All Time' | 'Today' | 'This Week' | 'This Month' | 'Last Month'

  // Active filters count indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeFilter !== 'All') count++;
    if (selectedPaymentMethod !== 'All') count++;
    if (minAmount.trim()) count++;
    if (maxAmount.trim()) count++;
    if (dateRangeFilter !== 'All Time') count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [activeFilter, selectedPaymentMethod, minAmount, maxAmount, dateRangeFilter, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setSelectedPaymentMethod('All');
    setMinAmount('');
    setMaxAmount('');
    setDateRangeFilter('All Time');
    setSortBy('newest');
  };

  // Export modal
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction.mutate(id),
        },
      ],
      'destructive'
    );
  };

  const handleExport = async (type) => {
    if (!filteredTxns || filteredTxns.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }

    const hasAccess = checkAccessAndExecute(async () => {
      setExporting(true);
      setExportModalVisible(false);
      try {
        if (type === 'excel') {
          await exportToExcel(filteredTxns);
        } else {
          await exportToPDF(filteredTxns);
        }
      } catch (err) {
        showAlert('Export Failed', err?.message || 'Could not export. Please try again.');
      } finally {
        setExporting(false);
      }
    });

    if (!hasAccess) {
      setExportModalVisible(false);
    }
  };

  // Compute Total Income, Total Expense, Net Balance
  const walletStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    if (transactions && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        if (t.type === 'income') {
          totalIncome += Number(t.amount) || 0;
        } else {
          totalExpense += Number(t.amount) || 0;
        }
      });
    }
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [transactions]);

  // Client-side advanced multi-criteria search & filtering
  const filteredTxns = useMemo(() => {
    let result = transactions ? [...transactions] : [];

    // 1. Smart Multi-Field Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const methodMatch = (t.paymentMethod || '').toLowerCase().includes(q);
        const notesMatch = (t.notes || t.note || '').toLowerCase().includes(q);
        const amountMatch = (t.amount ? String(t.amount) : '').includes(q);
        const dateMatch = t.transactionDate
          ? dayjs(t.transactionDate).format('DD MMMM YYYY MMMM dddd').toLowerCase().includes(q)
          : false;

        return descMatch || catMatch || methodMatch || notesMatch || amountMatch || dateMatch;
      });
    }

    // 2. Main Category / Type Filter Chip
    if (activeFilter !== 'All') {
      if (activeFilter === 'Income') {
        result = result.filter((t) => t.type === 'income');
      } else if (activeFilter === 'Expense') {
        result = result.filter((t) => t.type === 'expense');
      } else {
        result = result.filter(
          (t) => (t.category || '').toLowerCase() === activeFilter.toLowerCase()
        );
      }
    }

    // 3. Payment Method Filter
    if (selectedPaymentMethod !== 'All') {
      result = result.filter(
        (t) => (t.paymentMethod || '').toLowerCase().includes(selectedPaymentMethod.toLowerCase())
      );
    }

    // 4. Amount Range Filter
    if (minAmount.trim() && !isNaN(Number(minAmount))) {
      result = result.filter((t) => Number(t.amount) >= Number(minAmount));
    }
    if (maxAmount.trim() && !isNaN(Number(maxAmount))) {
      result = result.filter((t) => Number(t.amount) <= Number(maxAmount));
    }

    // 5. Date Range Filter Presets
    if (dateRangeFilter !== 'All Time') {
      const now = dayjs();
      if (dateRangeFilter === 'Today') {
        result = result.filter((t) => dayjs(t.transactionDate).isSame(now, 'day'));
      } else if (dateRangeFilter === 'This Week') {
        const startOfWeek = now.startOf('week');
        result = result.filter((t) => dayjs(t.transactionDate).isAfter(startOfWeek));
      } else if (dateRangeFilter === 'This Month') {
        result = result.filter((t) => dayjs(t.transactionDate).isSame(now, 'month'));
      } else if (dateRangeFilter === 'Last Month') {
        const lastMonth = now.subtract(1, 'month');
        result = result.filter((t) => dayjs(t.transactionDate).isSame(lastMonth, 'month'));
      }
    }

    // 6. Sorting
    if (sortBy === 'newest') {
      result.sort(
        (a, b) => dayjs(b.transactionDate).valueOf() - dayjs(a.transactionDate).valueOf()
      );
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) => dayjs(a.transactionDate).valueOf() - dayjs(b.transactionDate).valueOf()
      );
    } else if (sortBy === 'amount_high') {
      result.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sortBy === 'amount_low') {
      result.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    }

    return result;
  }, [transactions, searchQuery, activeFilter, selectedPaymentMethod, minAmount, maxAmount, dateRangeFilter, sortBy]);

  // Group filtered transactions by formatted date
  const groupedTxns = useMemo(() => {
    const groups = {};
    filteredTxns.forEach((t) => {
      const dateStr = formatDateGroup(t.transactionDate);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(t);
    });

    return Object.keys(groups).map((dateGroupName) => ({
      date: dateGroupName,
      data: groups[dateGroupName],
    }));
  }, [filteredTxns]);

  // Header Component featuring the Hero Digital Wallet Card
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* App Header Bar */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.screenSubtitle}>MY DIGITAL WALLET</Text>
          <Text style={styles.screenTitle}>Wallet & Passbook</Text>
        </View>
        <View style={styles.headerRightBtns}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Calendar')}
            activeOpacity={0.7}
          >
            <Icon name="calendar-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.primary }]}
            onPress={() => setExportModalVisible(true)}
            activeOpacity={0.7}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="download-outline" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Glassmorphic Wallet Card */}
      <LinearGradient
        colors={['#8A3FFC', '#5E1BDB', '#1A1C29']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.walletCard}
      >
        <View style={styles.walletCardTop}>
          <View style={styles.chipRow}>
            <View style={styles.simChip}>
              <View style={styles.chipLineHorizontal} />
              <View style={styles.chipLineVertical} />
            </View>
            <Icon name="wifi-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
          </View>
          <Text style={styles.walletBrandText}>AI WALLET</Text>
        </View>

        <Text style={styles.balanceLabel}>NET BALANCE</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(walletStats.netBalance)}
        </Text>

        {/* User Mobile Number or Email */}
        <View style={styles.cardMobileRow}>
          <Icon name="call-outline" size={13} color="rgba(255, 255, 255, 0.6)" style={{ marginRight: 6 }} />
          <Text style={styles.cardNumberText}>
            {formatMobileDisplay(user?.mobile, user?.email)}
          </Text>
        </View>

        {/* Income & Expense Badges */}
        <View style={styles.walletBadgesRow}>
          <View style={styles.statBadge}>
            <View style={styles.incomeIconCircle}>
              <Icon name="arrow-down-circle" size={16} color="#00D26A" />
            </View>
            <View>
              <Text style={styles.statBadgeLabel}>Income</Text>
              <Text style={styles.incomeStatText}>
                +{formatCurrency(walletStats.totalIncome)}
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBadge}>
            <View style={styles.expenseIconCircle}>
              <Icon name="arrow-up-circle" size={16} color="#FF4D67" />
            </View>
            <View>
              <Text style={styles.statBadgeLabel}>Expense</Text>
              <Text style={styles.expenseStatText}>
                -{formatCurrency(walletStats.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Action Buttons Bar */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => navigation.navigate('AddTransaction')}
            activeOpacity={0.8}
          >
            <Icon name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.cardActionText}>Add New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => setExportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.cardActionText}>Statement</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Input Bar with Clear Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search desc, amount (e.g. 500), category, method..."
            icon={<Icon name="search-outline" size={20} color={colors.text.muted} />}
            style={styles.searchInput}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Icon name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Count & Quick Reset Row */}
      {(searchQuery.trim().length > 0 || activeFiltersCount > 0) && (
        <View style={styles.resultsBadgeRow}>
          <Text style={styles.resultsCountText}>
            {filteredTxns.length} transaction{filteredTxns.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity onPress={resetAllFilters}>
            <Text style={styles.resetAllBtnText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filter Removable Pills */}
      {activeFiltersCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activePillsScroll}
        >
          {activeFilter !== 'All' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setActiveFilter('All')}>
              <Text style={styles.activePillText}>{activeFilter}</Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {selectedPaymentMethod !== 'All' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setSelectedPaymentMethod('All')}>
              <Text style={styles.activePillText}>Method: {selectedPaymentMethod}</Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {minAmount.trim() !== '' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setMinAmount('')}>
              <Text style={styles.activePillText}>Min: ₹{minAmount}</Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {maxAmount.trim() !== '' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setMaxAmount('')}>
              <Text style={styles.activePillText}>Max: ₹{maxAmount}</Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {dateRangeFilter !== 'All Time' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setDateRangeFilter('All Time')}>
              <Text style={styles.activePillText}>{dateRangeFilter}</Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {sortBy !== 'newest' && (
            <TouchableOpacity style={styles.activePill} onPress={() => setSortBy('newest')}>
              <Text style={styles.activePillText}>
                Sort: {sortBy === 'oldest' ? 'Oldest' : sortBy === 'amount_high' ? 'High Amount' : 'Low Amount'}
              </Text>
              <Icon name="close" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Filter Chips Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip;
          return (
            <TouchableOpacity
              key={chip}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(chip)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        statusBarColor={colors.background}
        edges={['top', 'left', 'right']}
        safeAreaStyle={styles.safeArea}
      >
        <FlatList
          data={groupedTxns}
          keyExtractor={(item) => item.date}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listScrollContent}
          ListEmptyComponent={
            txLoading ? (
              <ActivityIndicator
                color={colors.primary}
                size="large"
                style={{ marginTop: spacing.xl }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="receipt-outline" size={48} color={colors.text.muted} />
                <Text style={styles.emptyText}>No transactions found</Text>
              </View>
            )
          }
          renderItem={({ item: dateGroup }) => (
            <View style={styles.dateGroup}>
              {/* Group Date Header */}
              <Text style={styles.dateHeader}>{dateGroup.date}</Text>

              {/* Transactions in this date group */}
              {dateGroup.data.map((txn) => (
                <TransactionCard
                  key={txn._id}
                  title={txn.description}
                  category={txn.category}
                  paymentMethod={txn.paymentMethod}
                  amount={formatCurrency(txn.amount)}
                  type={txn.type}
                  onEdit={() => navigation.navigate('AddTransaction', { id: txn._id })}
                  onDelete={() => handleDelete(txn._id)}
                  onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
                />
              ))}
            </View>
          )}
        />

        {/* Floating Filter Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setFilterModalVisible(true)}
          style={[styles.floatingFilterBtn, shadow.lg]}
        >
          <Icon name="options-outline" size={20} color="#FFFFFF" />
          <Text style={styles.filterBtnText}>
            Sort & Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Export Modal */}
        <Modal
          visible={exportModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setExportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Export Statement</Text>
                <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.exportSubtitle}>
                {filteredTxns.length} transaction{filteredTxns.length !== 1 ? 's' : ''} will be
                exported
              </Text>

              <TouchableOpacity
                style={styles.exportOption}
                activeOpacity={0.8}
                onPress={() => handleExport('excel')}
              >
                <View
                  style={[
                    styles.exportIconBox,
                    { backgroundColor: 'rgba(0, 196, 140, 0.12)' },
                  ]}
                >
                  <Icon name="grid-outline" size={24} color="#00C48C" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>Export Excel Sheet</Text>
                  <Text style={styles.exportOptionDesc}>
                    Spreadsheet (.xlsx) — open in Excel or Google Sheets
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                activeOpacity={0.8}
                onPress={() => handleExport('pdf')}
              >
                <View
                  style={[
                    styles.exportIconBox,
                    { backgroundColor: 'rgba(255, 100, 124, 0.12)' },
                  ]}
                >
                  <Icon name="document-text-outline" size={24} color="#FF647C" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>Export PDF Statement</Text>
                  <Text style={styles.exportOptionDesc}>
                    Printable financial report with summaries
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </Card>
          </View>
        </Modal>

        {/* Advanced Filter & Sort Modal Bottom Sheet */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Advanced Filters</Text>
                  <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                    <Icon name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* 1. Sort Order */}
                <Text style={styles.filterGroupLabel}>Sort Order</Text>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: 'Newest First', value: 'newest' },
                    { label: 'Oldest First', value: 'oldest' },
                    { label: 'Highest Amount', value: 'amount_high' },
                    { label: 'Lowest Amount', value: 'amount_low' },
                  ].map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.8}
                        onPress={() => setSortBy(opt.value)}
                        style={[styles.filterChipItem, isSelected && styles.filterChipItemActive]}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Date Range Presets */}
                <Text style={styles.filterGroupLabel}>Date Period</Text>
                <View style={styles.filterOptionsGrid}>
                  {['All Time', 'Today', 'This Week', 'This Month', 'Last Month'].map((period) => {
                    const isSelected = dateRangeFilter === period;
                    return (
                      <TouchableOpacity
                        key={period}
                        activeOpacity={0.8}
                        onPress={() => setDateRangeFilter(period)}
                        style={[styles.filterChipItem, isSelected && styles.filterChipItemActive]}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. Payment Method */}
                <Text style={styles.filterGroupLabel}>Payment Method</Text>
                <View style={styles.filterOptionsGrid}>
                  {['All', 'UPI', 'Card', 'Cash', 'Bank Transfer'].map((method) => {
                    const isSelected = selectedPaymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        activeOpacity={0.8}
                        onPress={() => setSelectedPaymentMethod(method)}
                        style={[styles.filterChipItem, isSelected && styles.filterChipItemActive]}
                      >
                        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 4. Amount Range Inputs */}
                <Text style={styles.filterGroupLabel}>Amount Range (₹)</Text>
                <View style={styles.amountInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      value={minAmount}
                      onChangeText={setMinAmount}
                      placeholder="Min Amount (e.g. 100)"
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.dashText}>─</Text>
                  <View style={{ flex: 1 }}>
                    <Input
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      placeholder="Max Amount (e.g. 5000)"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Modal Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalResetBtn}
                    onPress={resetAllFilters}
                  >
                    <Text style={styles.modalResetText}>Reset All</Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    title="Apply Filters"
                    onPress={() => setFilterModalVisible(false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingBottom: 0,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  screenSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryLight,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerRightBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  walletCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  simChip: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E6B800',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  chipLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#B38F00',
  },
  chipLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#B38F00',
  },
  walletBrandText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.5,
  },
  balanceLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: typography.sizes.display + 6,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  cardMobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardNumberText: {
    fontSize: typography.sizes.xs + 1,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  walletBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  incomeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 210, 106, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 77, 103, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
  incomeStatText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#00D26A',
  },
  expenseStatText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FF4D67',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: spacing.sm,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardActionText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  searchRow: {
    marginBottom: spacing.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  chipsScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  listScrollContent: {
    paddingBottom: 90,
  },
  dateGroup: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  floatingFilterBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 8,
  },
  filterBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  exportSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  exportIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportOptionText: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  exportOptionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  filterGroupLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterOptions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterOptRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterOptRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
  },
  filterOptText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterOptTextActive: {
    color: colors.primaryLight,
    fontWeight: typography.weights.bold,
  },
  modalApplyBtn: {
    marginTop: spacing.md,
  },
  searchInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
    zIndex: 10,
  },
  resultsBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultsCountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryLight,
  },
  resetAllBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.danger || '#FF4D67',
  },
  activePillsScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  filterChipItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  amountInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dashText: {
    color: colors.text.muted,
    fontWeight: 'bold',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalResetBtn: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalResetText: {
    color: colors.danger || '#FF4D67',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});

export default TransactionsScreen;
