import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import TransactionCard from '../../components/molecules/TransactionCard';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import useBanks from '../../hooks/useBanks';
import { formatCurrency, getStoredAmountForCurrency } from '../../utils/formatCurrency';
import { useAlert } from '../../context/AlertContext';
import BankLogo from '../../components/atoms/BankLogo';
import { useAuth } from '../../hooks/useAuth';
import { getGlobalCurrency } from '../../utils/formatCurrency';

const formatDateGroup = (dateInput) => {
  const d = dayjs(dateInput);
  const today = dayjs();
  if (d.isSame(today, 'day')) return 'Today';
  if (d.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday';
  return d.format('DD MMMM YYYY');
};

const BankDetailsScreen = ({ navigation, route }) => {
  const { bankId, bank: initialBank } = route.params || {};
  const { user } = useAuth();
  const activeCurrency = user?.currency || getGlobalCurrency() || 'INR';

  const { banks, refetch: refetchBanks } = useBanks();
  const { data: transactions, isLoading: txLoading, refetch: refetchTxns } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const { showAlert } = useAlert();

  useFocusEffect(
    useCallback(() => {
      refetchBanks(true);
      refetchTxns();
    }, [refetchBanks, refetchTxns])
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'

  // Resolve target bank details
  const bank = useMemo(() => {
    if (banks && banks.length > 0 && bankId) {
      const found = banks.find((b) => String(b._id) === String(bankId));
      if (found) return found;
    }
    return initialBank || { bankName: 'Bank Account' };
  }, [banks, bankId, initialBank]);

  const targetBankId = bank?._id || bankId;

  // Filter transactions strictly for this bank account
  const bankTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions) || !targetBankId) return [];
    return transactions.filter((t) => {
      if (!t.bankAccount) return false;
      const bId = typeof t.bankAccount === 'object' ? t.bankAccount._id : t.bankAccount;
      const bName = typeof t.bankAccount === 'object' ? t.bankAccount.bankName : null;
      
      const idMatch = bId && String(bId) === String(targetBankId);
      const nameMatch = bName && bank?.bankName && String(bName).toLowerCase().trim() === String(bank.bankName).toLowerCase().trim();
      return idMatch || nameMatch;
    });
  }, [transactions, targetBankId, bank?.bankName]);

  // Compute Total Income and Total Expense for this specific bank
  const { totalExpense, totalIncome } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    bankTransactions.forEach((t) => {
      const amt = getStoredAmountForCurrency(t, activeCurrency);
      if (t.type === 'income') {
        inc += amt;
      } else {
        exp += amt;
      }
    });
    return { totalExpense: exp, totalIncome: inc };
  }, [bankTransactions, activeCurrency]);

  // Apply search query and type filter
  const filteredTxns = useMemo(() => {
    let result = [...bankTransactions];

    if (activeFilter === 'EXPENSE') {
      result = result.filter((t) => t.type === 'expense');
    } else if (activeFilter === 'INCOME') {
      result = result.filter((t) => t.type === 'income');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const amountMatch = String(getStoredAmountForCurrency(t, activeCurrency)).includes(q);
        return descMatch || catMatch || amountMatch;
      });
    }

    return result;
  }, [bankTransactions, activeFilter, searchQuery, activeCurrency]);

  // Group transactions by date
  const groupedTxns = useMemo(() => {
    const groups = {};
    filteredTxns.forEach((t) => {
      const dateKey = formatDateGroup(t.transactionDate || t.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return Object.keys(groups).map((dateGroupName) => ({
      date: dateGroupName,
      data: groups[dateGroupName],
    }));
  }, [filteredTxns]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBanks(true), refetchTxns()]);
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

  const last4Digits = bank.accountNumber ? bank.accountNumber.slice(-4) : '••••';

  // Render Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* App Navigation Bar */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {bank.nickname || bank.bankName}
          </Text>
          <Text style={styles.navSubtitle}>Bank Account Statement</Text>
        </View>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            try {
              navigation.navigate('BankAccounts');
            } catch {
              navigation.navigate('Profile', { screen: 'BankAccounts' });
            }
          }}
          activeOpacity={0.7}
        >
          <Icon name="settings-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Hero Bank Account Card */}
      <LinearGradient
        colors={['#171B30', '#0D0F1F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBankCard}
      >
        <View style={styles.bankCardHeader}>
          <View style={styles.bankIconGroup}>
            <BankLogo bankName={bank.bankName} size={36} />
            <View>
              <Text style={styles.bankNameText}>{bank.bankName}</Text>
              {bank.accountType && (
                <Text style={styles.bankTypeBadgeText}>
                  {bank.accountType} Account
                </Text>
              )}
            </View>
          </View>
          {bank.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
            </View>
          )}
        </View>

        <View style={styles.accNumberRow}>
          <Text style={styles.accNumberLabel}>Account Number</Text>
          <Text style={styles.accNumberValue}>•••• •••• {last4Digits}</Text>
        </View>

        {bank.upiId ? (
          <View style={styles.upiRow}>
            <Icon name="qr-code-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.upiText}>UPI: {bank.upiId}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* 2 Summary Stats Cards Row */}
      <View style={styles.statsRow}>
        {/* Card 1: Total Expenses */}
        <LinearGradient
          colors={['rgba(255, 77, 103, 0.15)', 'rgba(255, 77, 103, 0.04)']}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsIconWrapperDanger}>
            <Icon name="arrow-down" size={16} color={colors.danger || '#FF4D67'} />
          </View>
          <Text style={styles.statsLabel}>Total Expenses</Text>
          <Text style={[styles.statsAmount, { color: colors.danger || '#FF4D67' }]}>
            {formatCurrency(totalExpense, activeCurrency)}
          </Text>
        </LinearGradient>

        {/* Card 2: Total Income */}
        <LinearGradient
          colors={['rgba(0, 210, 106, 0.15)', 'rgba(0, 210, 106, 0.04)']}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsIconWrapperSuccess}>
            <Icon name="arrow-up" size={16} color={colors.success || '#00D26A'} />
          </View>
          <Text style={styles.statsLabel}>Total Income</Text>
          <Text style={[styles.statsAmount, { color: colors.success || '#00D26A' }]}>
            {formatCurrency(totalIncome, activeCurrency)}
          </Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs & Search */}
      <View style={styles.searchFilterSection}>
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
              All ({bankTransactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'EXPENSE' && styles.filterTabActiveExpense]}
            onPress={() => setActiveFilter('EXPENSE')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'EXPENSE' && styles.filterTabTextExpense]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'INCOME' && styles.filterTabActiveIncome]}
            onPress={() => setActiveFilter('INCOME')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'INCOME' && styles.filterTabTextIncome]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search bank transactions..."
          icon={<Icon name="search-outline" size={18} color={colors.text.muted} />}
          style={styles.searchInput}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen statusBarColor={colors.background} edges={['top', 'left', 'right']}>
        {txLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groupedTxns}
            keyExtractor={(item, index) => item.date || `group-${index}`}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.dateGroupContainer}>
                <Text style={styles.dateGroupHeader}>{item.date}</Text>
                {item.data.map((txn, index) => (
                  <TransactionCard
                    key={txn._id || txn.id || `txn-${index}`}
                  title={txn.description || txn.category}
                  category={txn.category}
                  paymentMethod={txn.paymentMethod || 'UPI'}
                  amount={formatCurrency(getStoredAmountForCurrency(txn, activeCurrency), activeCurrency)}
                  type={txn.type}
                    onEdit={() => navigation.navigate('AddTransaction', { id: txn._id || txn.id, transaction: txn })}
                    onDelete={() => handleDelete(txn._id || txn.id)}
                    onPress={() =>
                      navigation.navigate('TransactionDetail', { id: txn._id || txn.id, transaction: txn })
                    }
                  />
                ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Icon name="receipt-outline" size={32} color={colors.text.secondary} />
                </View>
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySubtext}>
                  No transactions recorded for {bank.bankName} yet.
                </Text>
                <TouchableOpacity
                  style={styles.addTxnBtn}
                  onPress={() =>
                    navigation.navigate('AddTransaction', { defaultBankId: targetBankId })
                  }
                  activeOpacity={0.85}
                >
                  <Icon name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addTxnBtnText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  navTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  navSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  heroBankCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bankIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankCardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankNameText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bankTypeBadgeText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  primaryBadge: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.3)',
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success || '#00D26A',
  },
  accNumberRow: {
    marginBottom: spacing.xs,
  },
  accNumberLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accNumberValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  upiText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statsCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsIconWrapperDanger: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 103, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statsIconWrapperSuccess: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 210, 106, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statsLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statsAmount: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    marginTop: 2,
  },
  searchFilterSection: {
    gap: spacing.sm,
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabActiveExpense: {
    backgroundColor: colors.danger || '#FF4D67',
  },
  filterTabActiveIncome: {
    backgroundColor: colors.success || '#00D26A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTabTextExpense: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterTabTextIncome: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  dateGroupContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateGroupHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addTxnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addTxnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});

export default BankDetailsScreen;
