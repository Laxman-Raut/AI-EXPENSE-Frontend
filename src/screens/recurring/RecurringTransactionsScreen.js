import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, radius, typography, shadow } from '../../theme';
import { useAlert } from '../../context/AlertContext';
import {
  useRecurringTransactions,
  useDeleteRecurringTransaction,
  useToggleRecurringTransactionStatus,
} from '../../hooks/useRecurringTransactions';
import { formatCurrency } from '../../utils/formatCurrency';
import dayjs from 'dayjs';

const RecurringTransactionsScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const { data: recurringList = [], isLoading, refetch } = useRecurringTransactions();
  const deleteMutation = useDeleteRecurringTransaction();
  const toggleStatusMutation = useToggleRecurringTransactionStatus();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Recurring Template',
      'Are you sure you want to delete this recurring transaction template? This will stop future automatic generations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(id, {
              onSuccess: () => {
                showAlert('Success', 'Recurring transaction template deleted successfully.');
              },
              onError: (err) => {
                showAlert('Error', err.message || 'Failed to delete template.');
              },
            });
          },
        },
      ],
      'destructive'
    );
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatusMutation.mutate(
      { id, status: nextStatus },
      {
        onSuccess: () => {
          showAlert(
            'Status Updated',
            `Recurring transaction has been successfully ${nextStatus === 'active' ? 'resumed' : 'paused'}.`
          );
        },
        onError: (err) => {
          showAlert('Error', err.message || 'Failed to update status.');
        },
      }
    );
  };

  // Render Header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="chevron-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Recurring Bills & Salary</Text>

      <TouchableOpacity
        style={styles.addHeaderBtn}
        onPress={() => navigation.navigate('AddEditRecurring')}
        activeOpacity={0.7}
      >
        <Icon name="add" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  // Render Card Row
  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const isActive = item.status === 'active';
    
    // Choose icon based on category
    let iconName = 'repeat-outline';
    if (item.category === 'Food') iconName = 'fast-food-outline';
    else if (item.category === 'Shopping') iconName = 'bag-handle-outline';
    else if (item.category === 'Travel') iconName = 'car-outline';
    else if (item.category === 'Grocery') iconName = 'cart-outline';
    else if (item.category === 'Rent') iconName = 'home-outline';
    else if (item.category === 'Investments') iconName = 'trending-up-outline';
    else if (item.category === 'Health') iconName = 'heart-outline';
    else if (item.category === 'EMI/Bill' || item.category === 'Bills') iconName = 'receipt-outline';
    else if (item.category === 'Subscriptions') iconName = 'tv-outline';

    const cardBgColor = isActive ? colors.surface : colors.surface + '80'; // Dim if paused

    return (
      <Card style={[styles.card, { backgroundColor: cardBgColor }, shadow.sm]}>
        {/* Left Side: Icon & Details */}
        <View style={styles.itemRow}>
          <View style={[styles.iconBox, { backgroundColor: isExpense ? 'rgba(255,77,103,0.1)' : 'rgba(0,210,106,0.1)' }]}>
            <Icon name={iconName} size={22} color={isExpense ? colors.danger : colors.success} />
          </View>

          <View style={styles.contentBox}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, !isActive && styles.pausedText]} numberOfLines={1}>
                {item.description}
              </Text>
              <View style={[styles.freqBadge, { backgroundColor: isActive ? colors.primary + '15' : colors.text.muted + '20' }]}>
                <Text style={[styles.freqText, { color: isActive ? colors.primary : colors.text.muted }]}>
                  {item.frequency.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.categoryText}>{item.category} • {item.paymentMethod}</Text>
            
            <View style={styles.dateRow}>
              <Icon name="calendar-outline" size={12} color={colors.text.muted} />
              <Text style={styles.dateText}>
                Next: {dayjs(item.nextExecutionDate).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>

          {/* Right Side: Amount & Actions */}
          <View style={styles.rightBox}>
            <Text style={[styles.amountText, { color: isExpense ? colors.danger : colors.success }, !isActive && styles.pausedText]}>
              {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
            </Text>

            <View style={styles.actionsContainer}>
              {/* Pause/Resume Toggle */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isActive ? colors.warning + '18' : colors.success + '18' }]}
                onPress={() => handleToggleStatus(item._id, item.status)}
                activeOpacity={0.7}
              >
                <Icon
                  name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color={isActive ? colors.warning : colors.success}
                />
              </TouchableOpacity>

              {/* Edit */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}
                onPress={() => navigation.navigate('AddEditRecurring', { id: item._id })}
                activeOpacity={0.7}
              >
                <Icon name="create-outline" size={16} color={colors.primary} />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.danger + '18' }]}
                onPress={() => handleDelete(item._id)}
                activeOpacity={0.7}
              >
                <Icon name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // Empty State
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Icon name="repeat-outline" size={48} color={colors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>No Recurring Templates</Text>
      <Text style={styles.emptySubtitle}>
        Setup salary, rent, bills, or subscription templates to automate your expense logs!
      </Text>
      <TouchableOpacity
        style={styles.emptyAddBtn}
        onPress={() => navigation.navigate('AddEditRecurring')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.emptyAddBtnText}>Add Template</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen
      scrollable={false}
      header={renderHeader()}
      loading={isLoading && !refreshing}
      keyboardAvoiding={false}
    >
      <FlatList
        data={recurringList}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentBox: {
    flex: 1,
    marginRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: spacing.xs,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  pausedText: {
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  freqBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  freqText: {
    fontSize: 9,
    fontWeight: '700',
  },
  categoryText: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '500',
  },
  rightBox: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: 80,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyAddBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RecurringTransactionsScreen;
