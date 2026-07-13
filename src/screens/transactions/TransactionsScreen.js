import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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

const FILTER_CHIPS = ['All', 'Income', 'Expense', 'Food', 'Shopping', 'Bills', 'Travel'];

const formatDateGroup = (dateInput) => {
  const d = dayjs(dateInput);
  const today = dayjs();
  if (d.isSame(today, 'day')) return 'Today';
  if (d.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('DD MMMM YYYY');
};

const TransactionsScreen = ({ navigation }) => {
  const { data: transactions, isLoading: txLoading, refetch } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const { showAlert } = useAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Custom Filter Modal sheet
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'amount_high'

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
          onPress: () => deleteTransaction.mutate(id) 
        }
      ],
      'destructive'
    );
  };

  const handleExport = async (type) => {
    if (!filteredTxns || filteredTxns.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }
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
  };

  // Client-side search and filters
  const filteredTxns = useMemo(() => {
    let result = transactions ? [...transactions] : [];

    // 1. Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }

    // 2. Chip filter
    if (activeFilter !== 'All') {
      if (activeFilter === 'Income') {
        result = result.filter(t => t.type === 'income');
      } else if (activeFilter === 'Expense') {
        result = result.filter(t => t.type === 'expense');
      } else {
        result = result.filter(t => t.category.toLowerCase() === activeFilter.toLowerCase());
      }
    }

    // 3. Sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => dayjs(b.transactionDate).valueOf() - dayjs(a.transactionDate).valueOf());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => dayjs(a.transactionDate).valueOf() - dayjs(b.transactionDate).valueOf());
    } else if (sortBy === 'amount_high') {
      result.sort((a, b) => b.amount - a.amount);
    }

    return result;
  }, [transactions, searchQuery, activeFilter, sortBy]);

  // Group filtered transactions by formatted date
  const groupedTxns = useMemo(() => {
    const groups = {};
    filteredTxns.forEach(t => {
      const dateStr = formatDateGroup(t.transactionDate);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(t);
    });

    return Object.keys(groups).map(dateGroupName => ({
      date: dateGroupName,
      data: groups[dateGroupName]
    }));
  }, [filteredTxns]);

  return (
    <View style={styles.root}>
      <Screen 
        statusBarColor={colors.background}
        edges={['top', 'left', 'right']}
        safeAreaStyle={styles.safeArea}
      >
        {/* Search Input, Calendar & Export Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, marginBottom: spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search transactions..."
              icon={<Icon name="search-outline" size={20} color={colors.text.muted} />}
              style={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Icon name="calendar-outline" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
            onPress={() => setExportModalVisible(true)}
          >
            {exporting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="download-outline" size={22} color="#fff" />
            }
          </TouchableOpacity>
        </View>

        {/* Filter Chips list */}
        <View style={styles.chipsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {FILTER_CHIPS.map(chip => {
              const isActive = activeFilter === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  activeOpacity={0.8}
                  onPress={() => setActiveFilter(chip)}
                  style={[
                    styles.chip,
                    isActive && styles.chipActive
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    isActive && styles.chipTextActive
                  ]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Grouped Transaction History List */}
        <FlatList
          data={groupedTxns}
          keyExtractor={(item) => item.date}
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
              <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
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
              {dateGroup.data.map(txn => (
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
          activeOpacity={0.8}
          onPress={() => setFilterModalVisible(true)}
          style={[styles.floatingFilterBtn, shadow.lg]}
        >
          <Icon name="funnel" size={20} color="#FFFFFF" />
          <Text style={styles.filterBtnText}>Filters</Text>
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
                <Text style={styles.modalTitle}>Export Transactions</Text>
                <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.exportSubtitle}>
                {filteredTxns.length} transaction{filteredTxns.length !== 1 ? 's' : ''} will be exported
              </Text>

              <TouchableOpacity
                style={styles.exportOption}
                activeOpacity={0.8}
                onPress={() => handleExport('excel')}
              >
                <View style={[styles.exportIconBox, { backgroundColor: 'rgba(0, 196, 140, 0.12)' }]}>
                  <Icon name="grid-outline" size={24} color="#00C48C" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>Export as Excel</Text>
                  <Text style={styles.exportOptionDesc}>Spreadsheet (.xlsx) — open in Excel or Sheets</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                activeOpacity={0.8}
                onPress={() => handleExport('pdf')}
              >
                <View style={[styles.exportIconBox, { backgroundColor: 'rgba(255, 100, 124, 0.12)' }]}>
                  <Icon name="document-text-outline" size={24} color="#FF647C" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>Export as PDF</Text>
                  <Text style={styles.exportOptionDesc}>Printable report with summary stats</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </Card>
          </View>
        </Modal>

        {/* Premium Filter modal bottom sheet */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort & Filter</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.filterGroupLabel}>Sort By</Text>
              
              <View style={styles.filterOptions}>
                {[
                  { label: 'Newest First', value: 'newest' },
                  { label: 'Oldest First', value: 'oldest' },
                  { label: 'Highest Amount', value: 'amount_high' },
                ].map(opt => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => setSortBy(opt.value)}
                      style={[
                        styles.filterOptRow,
                        isSelected && styles.filterOptRowActive
                      ]}
                    >
                      <Text style={[
                        styles.filterOptText,
                        isSelected && styles.filterOptTextActive
                      ]}>
                        {opt.label}
                      </Text>
                      {isSelected && <Icon name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <PrimaryButton 
                title="Apply Filters" 
                onPress={() => setFilterModalVisible(false)} 
                style={styles.modalApplyBtn}
              />
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  chipsContainer: {
    marginBottom: spacing.md,
  },
  chipsScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  listScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120, // pad list above floating button and tab bars
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  exportIconBox: {
    width: 46,
    height: 46,
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
  floatingFilterBtn: {
    position: 'absolute',
    bottom: spacing.xxl + 60,
    left: '50%',
    transform: [{ translateX: -60 }], // center width 120
    width: 120,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    zIndex: 100,
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
  filterGroupLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterOptRowActive: {
    borderColor: colors.primary,
  },
  filterOptText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterOptTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  modalApplyBtn: {
    marginTop: spacing.md,
  },
});

export default TransactionsScreen;
