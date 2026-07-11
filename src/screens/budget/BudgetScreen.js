import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import dayjs from 'dayjs';

const BudgetScreen = () => {
  const { user, updateUser } = useAuth();
  const { data: transactions } = useTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Retrieve user total budget limit (default to 50000 if not set)
  const monthlyBudget = user?.monthlyBudget || 50000;

  // Calculate dynamic categories spent and limits
  const categories = useMemo(() => {
    const now = dayjs();
    const currentMonthTxns = transactions ? transactions.filter(t => {
      if (!t.transactionDate) return false;
      const tDate = dayjs(t.transactionDate);
      return tDate.isSame(now, 'month') && t.type === 'expense';
    }) : [];

    const spentMap = {};
    currentMonthTxns.forEach(t => {
      const cat = t.category || 'Others';
      spentMap[cat] = (spentMap[cat] || 0) + (t.amount || 0);
    });

    const categoryConfigs = [
      { name: 'Food', limitPct: 0.25, icon: 'fast-food', color: '#4B8CFF' },
      { name: 'Shopping', limitPct: 0.20, icon: 'bag', color: '#00D26A' },
      { name: 'Bills', limitPct: 0.30, icon: 'receipt', color: '#FFB648' },
      { name: 'Travel', limitPct: 0.15, icon: 'car', color: '#FF4D67' },
      { name: 'Investments', limitPct: 0.10, icon: 'trending-up', color: '#AF52DE' },
    ];

    return categoryConfigs.map(cfg => {
      const spent = spentMap[cfg.name] || 0;
      const limit = Math.round(monthlyBudget * cfg.limitPct);
      return {
        name: cfg.name,
        limit,
        spent,
        icon: cfg.icon,
        color: cfg.color,
      };
    });
  }, [transactions, monthlyBudget]);

  // Calculate stats
  const totalSpent = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.spent, 0);
  }, [categories]);

  const remainingBudget = useMemo(() => {
    return monthlyBudget - totalSpent;
  }, [monthlyBudget, totalSpent]);

  const utilizationPercentage = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    return Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100);
  }, [totalSpent, monthlyBudget]);

  const handleUpdateBudget = async () => {
    const val = Number(newBudgetVal);
    if (!newBudgetVal || isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount.');
      return;
    }
    
    try {
      setUpdateLoading(true);
      await updateUser({ monthlyBudget: val });
      setModalVisible(false);
      setNewBudgetVal('');
      Alert.alert('Success', 'Monthly budget updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update monthly budget.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Find any category exceeding 80% limit
  const alertCategories = useMemo(() => {
    return categories.filter(c => (c.spent / c.limit) >= 0.8);
  }, [categories]);

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        style={styles.contentContainer}
        safeAreaStyle={styles.safeArea}
      >
        {/* Monthly Budget Card */}
        <View style={styles.section}>
          <Card style={[styles.budgetCard, shadow.md]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>MONTHLY BUDGET LIMIT</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Icon name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.budgetValue}>{formatCurrency(monthlyBudget)}</Text>

            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressText}>Spent: {formatCurrency(totalSpent)}</Text>
                <Text style={styles.progressText}>{utilizationPercentage}% Used</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${utilizationPercentage}%`, backgroundColor: colors.primary }
                  ]} 
                />
              </View>
            </View>

            {/* Remaining budget highlights */}
            <View style={styles.cardFooter}>
              <Text style={styles.remainingLabel}>REMAINING BALANCE</Text>
              <Text style={[
                styles.remainingValue, 
                { color: remainingBudget >= 0 ? colors.success : colors.danger }
              ]}>
                {formatCurrency(remainingBudget)}
              </Text>
            </View>
          </Card>
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
                  • **{c.name}** category utilization is at **{Math.round((c.spent/c.limit)*100)}%** ({formatCurrency(c.spent)} of {formatCurrency(c.limit)} limit).
                </Text>
              ))}
            </Card>
          </View>
        )}

        {/* Category Budgets Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Limits</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.editLimitsText}>Adjust Limits</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesList}>
            {categories.map((cat) => {
              const pct = Math.min(Math.round((cat.spent / cat.limit) * 100), 100);
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
                      <Text style={styles.catSpent}>{formatCurrency(cat.spent)}</Text>
                      <Text style={styles.catLimit}>/ {formatCurrency(cat.limit)}</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${pct}%`, backgroundColor: cat.color }
                      ]} 
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        {/* Update Budget trigger button */}
        <View style={styles.btnWrapper}>
          <PrimaryButton
            title="Update Monthly Budget"
            onPress={() => setModalVisible(true)}
            type="outline"
          />
        </View>

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
              label="New Monthly Budget ($)"
              value={newBudgetVal}
              onChangeText={setNewBudgetVal}
              placeholder="e.g. 2500"
              keyboardType="numeric"
              icon={<Icon name="logo-usd" size={18} color={colors.text.secondary} />}
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
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
