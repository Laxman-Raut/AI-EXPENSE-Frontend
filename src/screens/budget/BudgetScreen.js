import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import {
  formatCurrency,
  getCurrencySymbol,
  convertCurrencyValue,
  getGlobalCurrency,
  getStoredAmountForCurrency,
} from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useAlert } from '../../context/AlertContext';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'fast-food', color: '#FF9500', defaultPct: 0.20 },
  { name: 'Shopping', icon: 'bag-handle', color: '#FF2D55', defaultPct: 0.15 },
  { name: 'Travel', icon: 'car', color: '#5856D6', defaultPct: 0.10 },
  { name: 'Grocery', icon: 'cart', color: '#34C759', defaultPct: 0.15 },
  { name: 'Rent', icon: 'home', color: '#AF52DE', defaultPct: 0.20 },
  { name: 'Investments', icon: 'trending-up', color: '#007AFF', defaultPct: 0.10 },
  { name: 'Health', icon: 'heart', color: '#FF3B30', defaultPct: 0.05 },
  { name: 'EMI/Bill', icon: 'receipt', color: '#FFCC00', defaultPct: 0.15 },
  { name: 'Subscriptions', icon: 'tv', color: '#5AC8FA', defaultPct: 0.05 },
  { name: 'Others', icon: 'ellipsis-horizontal', color: '#8E8E93', defaultPct: 0.05 },
];

const BudgetScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const activeCurrency = user?.currency || getGlobalCurrency() || 'INR';
  const { data: transactions } = useTransactions(activeCurrency);
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Category Budget states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [catBudgets, setCatBudgets] = useState({});

  // Retrieve user total budget limit in active currency
  const monthlyBudget = useMemo(() => {
    const stored = getStoredAmountForCurrency(user, activeCurrency, 'monthlyBudget');
    if (stored > 0) return stored;
    if (activeCurrency === 'USD') {
      if (user?.monthlyBudgetUSD && user.monthlyBudgetUSD > 0) return Number(user.monthlyBudgetUSD);
      if (user?.monthlyBudget && user.monthlyBudget > 0) return convertCurrencyValue(user.monthlyBudget, 'INR', 'USD');
      return 0;
    }
    if (user?.monthlyBudgetINR && user.monthlyBudgetINR > 0) return Number(user.monthlyBudgetINR);
    return Number(user?.monthlyBudget || 0);
  }, [user, activeCurrency]);

  // Calculate actual total spent in active currency for the current month across ALL categories
  const totalSpent = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return 0;
    const now = dayjs();
    const currentMonthTxns = transactions.filter(t => {
      if (!t.transactionDate && !t.createdAt) return false;
      const tDate = dayjs(t.transactionDate || t.createdAt);
      return tDate.isSame(now, 'month') && t.type === 'expense';
    });

    const sum = currentMonthTxns.reduce((acc, t) => {
      return acc + getStoredAmountForCurrency(t, activeCurrency);
    }, 0);

    return Number(sum.toFixed(2));
  }, [transactions, activeCurrency]);

  // Calculate dynamic categories spent and limits in active currency
  const categories = useMemo(() => {
    const now = dayjs();
    const currentMonthTxns = transactions && Array.isArray(transactions) ? transactions.filter(t => {
      if (!t.transactionDate && !t.createdAt) return false;
      const tDate = dayjs(t.transactionDate || t.createdAt);
      return tDate.isSame(now, 'month') && t.type === 'expense';
    }) : [];

    const spentMap = {};
    currentMonthTxns.forEach(t => {
      let cat = t.category || 'Others';
      if (cat === 'Bills') cat = 'EMI/Bill';
      const amt = getStoredAmountForCurrency(t, activeCurrency);
      spentMap[cat] = (spentMap[cat] || 0) + amt;
    });

    // Build comprehensive map: default categories + any category with transactions + categoryBudgets
    const categoryMap = new Map();
    DEFAULT_EXPENSE_CATEGORIES.forEach(cfg => {
      categoryMap.set(cfg.name, { ...cfg });
    });

    Object.keys(spentMap).forEach(catName => {
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, {
          name: catName,
          icon: 'pricetag',
          color: colors.primary,
          defaultPct: 0.05,
        });
      }
    });

    const userCatBudgets = user?.categoryBudgets || {};
    const budgetKeys = typeof userCatBudgets.keys === 'function'
      ? Array.from(userCatBudgets.keys())
      : Object.keys(userCatBudgets);

    budgetKeys.forEach(catName => {
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, {
          name: catName,
          icon: 'pricetag',
          color: colors.primary,
          defaultPct: 0.05,
        });
      }
    });

    return Array.from(categoryMap.values()).map(cfg => {
      const spent = spentMap[cfg.name] || 0;
      const rawUserLimit = typeof userCatBudgets.get === 'function'
        ? userCatBudgets.get(cfg.name)
        : userCatBudgets[cfg.name];

      let limit = 0;
      if (rawUserLimit !== undefined && rawUserLimit !== null && rawUserLimit > 0) {
        // Stored in base INR, convert to active currency
        limit = activeCurrency === 'USD'
          ? convertCurrencyValue(rawUserLimit, 'INR', 'USD')
          : Number(rawUserLimit);
      } else if (monthlyBudget > 0) {
        limit = Number((monthlyBudget * (cfg.defaultPct || 0.10)).toFixed(2));
      }

      return {
        name: cfg.name,
        limit: Number(limit.toFixed(2)),
        spent: Number(spent.toFixed(2)),
        icon: cfg.icon,
        color: cfg.color,
      };
    });
  }, [transactions, monthlyBudget, user, activeCurrency]);

  const remainingBudget = useMemo(() => {
    return Number((monthlyBudget - totalSpent).toFixed(2));
  }, [monthlyBudget, totalSpent]);

  const utilizationPercentage = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    return Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100);
  }, [totalSpent, monthlyBudget]);

  const handleOpenBudgetModal = () => {
    setNewBudgetVal(monthlyBudget > 0 ? String(monthlyBudget) : '');
    setModalVisible(true);
  };

  const handleUpdateBudget = async () => {
    const val = Number(newBudgetVal);
    if (!newBudgetVal || isNaN(val) || val < 0) {
      showAlert('Error', 'Please enter a valid budget amount.');
      return;
    }
    
    try {
      setUpdateLoading(true);
      await updateUser({ monthlyBudget: val, currency: activeCurrency });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setModalVisible(false);
      setNewBudgetVal('');
      showAlert('Success', 'Monthly budget updated successfully.');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update monthly budget.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenCategoryModal = () => {
    const initialBudgets = {};
    categories.forEach(cat => {
      initialBudgets[cat.name] = cat.limit > 0 ? String(cat.limit) : '';
    });
    setCatBudgets(initialBudgets);
    setCategoryModalVisible(true);
  };

  const handleSaveCategoryBudgets = async () => {
    const updatedBudgets = {};
    for (const key of Object.keys(catBudgets)) {
      const raw = catBudgets[key];
      if (raw === undefined || raw === null || String(raw).trim() === '') continue;
      const val = Number(raw);
      if (isNaN(val) || val < 0) {
        showAlert('Error', `Please enter a valid amount for ${key}.`);
        return;
      }
      // Store in base INR so that multi-currency conversion remains consistent
      const inrVal = activeCurrency === 'USD'
        ? Math.round(convertCurrencyValue(val, 'USD', 'INR'))
        : Math.round(val);
      updatedBudgets[key] = inrVal;
    }

    try {
      setUpdateLoading(true);
      await updateUser({ categoryBudgets: updatedBudgets, currency: activeCurrency });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setCategoryModalVisible(false);
      showAlert('Success', 'Category budgets updated successfully.');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update category budgets.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Find any category exceeding 80% limit
  const alertCategories = useMemo(() => {
    return categories.filter(c => c.limit > 0 && (c.spent / c.limit) >= 0.8);
  }, [categories]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation?.goBack?.()}
        activeOpacity={0.7}
      >
        <Icon name="chevron-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Monthly Budget</Text>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={handleOpenBudgetModal}
        activeOpacity={0.7}
      >
        <Icon name="create-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
        safeAreaStyle={styles.safeArea}
      >
        {/* Monthly Budget Card */}
        <View style={styles.section}>
          {monthlyBudget > 0 ? (
            <Card style={[styles.budgetCard, shadow.md]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>MONTHLY BUDGET LIMIT</Text>
                <TouchableOpacity onPress={handleOpenBudgetModal}>
                  <Icon name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.budgetValue}>{formatCurrency(monthlyBudget, activeCurrency)}</Text>

              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressText}>Spent: {formatCurrency(totalSpent, activeCurrency)}</Text>
                  <Text style={styles.progressText}>{utilizationPercentage}% Used</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      {
                        width: `${utilizationPercentage}%`,
                        backgroundColor: utilizationPercentage >= 90 ? colors.danger : colors.primary,
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Remaining budget highlights */}
              <View style={styles.cardFooter}>
                <Text style={styles.remainingLabel}>
                  {remainingBudget >= 0 ? 'REMAINING BALANCE' : 'OVERSPENT BY'}
                </Text>
                <Text style={[
                  styles.remainingValue, 
                  { color: remainingBudget >= 0 ? colors.success : colors.danger }
                ]}>
                  {formatCurrency(Math.abs(remainingBudget), activeCurrency)}
                </Text>
              </View>
            </Card>
          ) : (
            <Card style={[styles.emptyBudgetCard, shadow.md]}>
              <Icon name="wallet-outline" size={40} color={colors.primary} />
              <Text style={styles.emptyBudgetText}>No Monthly Budget Set</Text>
              <Text style={styles.emptyBudgetSub}>
                Set a monthly spending limit to track your expenses, avoid overspending, and receive smart budget burn alerts.
              </Text>
              <PrimaryButton
                title="Set Monthly Budget"
                onPress={handleOpenBudgetModal}
                type="primary"
                style={{ width: '100%', maxWidth: 220 }}
              />
            </Card>
          )}
        </View>

        {/* Budget Alert Card (Shows warnings if 80%+ limit reached) */}
        {alertCategories.length > 0 && (
          <View style={styles.section}>
            <Card variant="glass" style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Icon name="warning-outline" size={20} color={colors.warning} />
                <Text style={styles.alertTitle}>Budget Alerts</Text>
              </View>
              {alertCategories.map(c => (
                <Text key={c.name} style={styles.alertText}>
                  • <Text style={{ fontWeight: 'bold' }}>{c.name}</Text> utilization is at <Text style={{ fontWeight: 'bold' }}>{Math.round((c.spent/c.limit)*100)}%</Text> ({formatCurrency(c.spent, activeCurrency)} of {formatCurrency(c.limit, activeCurrency)} limit).
                </Text>
              ))}
            </Card>
          </View>
        )}

        {/* Category Budgets Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Limits</Text>
            <TouchableOpacity onPress={handleOpenCategoryModal}>
              <Text style={styles.editLimitsText}>Adjust Limits</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesList}>
            {categories.map((cat) => {
              const pct = cat.limit > 0 ? Math.min(Math.round((cat.spent / cat.limit) * 100), 100) : 0;
              return (
                <Card key={cat.name} style={styles.catCard}>
                  <View style={styles.catRow}>
                    <View style={styles.catHeaderLeft}>
                      <View style={[styles.catIconBox, { backgroundColor: cat.color + '15' }]}>
                        <Icon name={cat.icon} size={18} color={cat.color} />
                      </View>
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>
                    
                    <View style={styles.catHeaderRight}>
                      <Text style={styles.catSpent}>{formatCurrency(cat.spent, activeCurrency)}</Text>
                      {cat.limit > 0 ? (
                        <Text style={styles.catLimit}>/ {formatCurrency(cat.limit, activeCurrency)}</Text>
                      ) : null}
                    </View>
                  </View>

                  {cat.limit > 0 ? (
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          {
                            width: `${pct}%`,
                            backgroundColor: pct >= 90 ? colors.danger : cat.color,
                          }
                        ]} 
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>

        {/* Update Budget trigger button */}
        {monthlyBudget > 0 && (
          <View style={styles.btnWrapper}>
            <PrimaryButton
              title="Update Monthly Budget"
              onPress={handleOpenBudgetModal}
              type="outline"
            />
          </View>
        )}

        {/* Scroll footer padding */}
        <View style={{ height: 100 }} />
      </Screen>

      {/* Edit Budget Limit Modal sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Budget Limit</Text>
            
            <Input
              label={`Monthly Budget Limit (${getCurrencySymbol(activeCurrency)})`}
              value={newBudgetVal}
              onChangeText={setNewBudgetVal}
              placeholder="e.g. 25000"
              keyboardType="numeric"
              icon={<Icon name="cash-outline" size={18} color={colors.text.secondary} />}
            />

            <View style={styles.modalActions}>
              <PrimaryButton 
                title="Cancel" 
                onPress={() => setModalVisible(false)} 
                type="ghost"
                style={styles.modalCancel}
              />
              <PrimaryButton 
                title="Confirm" 
                onPress={handleUpdateBudget} 
                loading={updateLoading}
                type="primary"
                style={styles.modalConfirm}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Edit Category Budgets Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Category Limits</Text>
            <ScrollView style={{ maxHeight: 340, marginBottom: spacing.md }} showsVerticalScrollIndicator={false}>
              {categories.map(cat => (
                <Input
                  key={cat.name}
                  label={`${cat.name} Limit (${getCurrencySymbol(activeCurrency)})`}
                  value={catBudgets[cat.name] || ''}
                  onChangeText={(val) => setCatBudgets(prev => ({ ...prev, [cat.name]: val }))}
                  placeholder="e.g. 5000"
                  keyboardType="numeric"
                  icon={<Icon name={cat.icon} size={18} color={cat.color} />}
                />
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <PrimaryButton 
                title="Cancel" 
                onPress={() => setCategoryModalVisible(false)} 
                type="ghost"
                style={styles.modalCancel}
              />
              <PrimaryButton 
                title="Save Limits" 
                onPress={handleSaveCategoryBudgets} 
                loading={updateLoading}
                type="primary"
                style={styles.modalConfirm}
              />
            </View>
          </Card>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptyBudgetCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBudgetText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyBudgetSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  editLimitsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  budgetCard: {
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  budgetValue: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  remainingValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  alertCard: {
    borderColor: 'rgba(255, 182, 72, 0.25)', // soft warning border
    padding: spacing.lg,
    gap: spacing.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  alertTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.warning,
  },
  alertText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base,
  },
  categoriesList: {
    gap: spacing.sm,
  },
  catCard: {
    padding: spacing.md,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  catHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  catHeaderRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  catSpent: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  catLimit: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginLeft: 2,
  },
  btnWrapper: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancel: {
    flex: 1,
  },
  modalConfirm: {
    flex: 1,
  },
});

export default BudgetScreen;
