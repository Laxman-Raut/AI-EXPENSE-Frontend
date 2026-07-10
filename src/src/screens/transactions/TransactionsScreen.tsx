import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Transaction } from '../../types';

const CATEGORY_ICONS: Record<string, string> = {
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

const getCategoryIcon = (category: string): string => {
  const key = category.toLowerCase();
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
};

type FilterType = 'all' | 'income' | 'expense';

const TransactionsScreen: React.FC<any> = ({ navigation }) => {
  const { data: transactions, isLoading, refetch } = useTransactions();
  const deleteTransaction = useDeleteTransaction();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === 'all') return transactions;
    return transactions.filter((t: Transaction) => t.type === filter);
  }, [transactions, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, description: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction.mutate(id),
        },
      ],
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TransactionDetail', { id: item._id })}
      onLongPress={() => handleDelete(item._id, item.description)}
      activeOpacity={0.7}>
      <GlassCard style={styles.txnCard}>
        <View style={styles.txnRow}>
          <View
            style={[
              styles.txnIconBg,
              {
                backgroundColor:
                  item.type === 'income' ? Colors.incomeBg : Colors.expenseBg,
              },
            ]}>
            <Icon
              name={getCategoryIcon(item.category)}
              size={20}
              color={item.type === 'income' ? Colors.income : Colors.expense}
            />
          </View>
          <View style={styles.txnInfo}>
            <Text style={styles.txnDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.txnMeta}>
              {item.category} • {item.paymentMethod} • {formatDate(item.transactionDate)}
            </Text>
          </View>
          <View style={styles.txnAmountContainer}>
            <Text
              style={[
                styles.txnAmount,
                { color: item.type === 'income' ? Colors.income : Colors.expense },
              ]}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            {item.note ? (
              <Icon name="document-text-outline" size={12} color={Colors.textMuted} />
            ) : null}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (isLoading && !transactions) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddTransaction')}>
            <Icon name="add" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'income', 'expense'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                filter === type && styles.filterTabActive,
              ]}
              onPress={() => setFilter(type)}>
              <Text
                style={[
                  styles.filterText,
                  filter === type && styles.filterTextActive,
                ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="receipt-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {filter !== 'all'
                  ? `No ${filter} transactions yet`
                  : 'Tap + to add your first transaction'}
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddTransaction')}
          activeOpacity={0.8}>
          <Icon name="add" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Spacing.borderRadiusRound,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 100,
  },
  txnCard: {
    marginBottom: Spacing.sm,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  txnInfo: {
    flex: 1,
  },
  txnDescription: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  txnMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txnAmount: {
    ...Typography.amountSmall,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default TransactionsScreen;
