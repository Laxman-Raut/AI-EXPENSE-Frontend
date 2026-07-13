import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useCreateTransaction, useUpdateTransaction, useTransaction } from '../../hooks/useTransactions';
import { useAlert } from '../../context/AlertContext';

const CATEGORIES = [
  { name: 'Food', icon: 'fast-food' },
  { name: 'Shopping', icon: 'bag' },
  { name: 'Travel', icon: 'airplane' },
  { name: 'Grocery', icon: 'cart' },
  { name: 'Rent', icon: 'home' },
  { name: 'Investments', icon: 'trending-up' },
  { name: 'Health', icon: 'heart' },
  { name: 'EMI/Bill', icon: 'receipt' },
  { name: 'Subscriptions', icon: 'tv' },
  { name: 'Others', icon: 'ellipsis-horizontal' },
];

const AddTransactionScreen = ({ navigation, route }) => {
  const transactionId = route.params?.id;
  const isEditing = !!transactionId;

  const { data: transactionDetails } = useTransaction(transactionId);
  const { showAlert } = useAlert();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [activeType, setActiveType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [notes, setNotes] = useState('');
  const [dateText, setDateText] = useState(dayjs().format('MMM DD, YYYY'));
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(dayjs());

  // Populate data when editing
  useEffect(() => {
    if (isEditing && transactionDetails) {
      setActiveType(transactionDetails.type || 'expense');
      setAmount(String(transactionDetails.amount || ''));
      setCategory(transactionDetails.category || 'Food');
      setNotes(transactionDetails.description || '');
      if (transactionDetails.transactionDate) {
        const dateObj = new Date(transactionDetails.transactionDate);
        setTransactionDate(dateObj);
        setDateText(dayjs(dateObj).format('MMM DD, YYYY'));
      }
    }
  }, [transactionDetails, isEditing]);

  // Handle selected category returned from Categories screen selection
  useEffect(() => {
    if (route.params?.selectedCategory) {
      setCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount.');
      return;
    }

    const payload = {
      type: activeType,
      category,
      amount: Number(amount),
      description: (notes && notes.trim().length >= 3) ? notes : `${category} transaction`,
      paymentMethod: activeType === 'expense' ? 'UPI' : 'Bank Transfer',
      note: notes,
      transactionDate: transactionDate.toISOString(),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transactionId, data: payload });
        showAlert('Success', 'Transaction updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createMutation.mutateAsync(payload);
        showAlert('Success', 'Transaction saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      showAlert('Error', error.message || 'Something went wrong.');
    }
  };

  const handlePrevMonth = () => {
    setPickerMonth(pickerMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setPickerMonth(pickerMonth.add(1, 'month'));
  };

  const handleDateSelect = (date) => {
    const today = dayjs();
    if (date.isAfter(today, 'day')) {
      showAlert('Invalid Date', 'You cannot select a future date.');
      return;
    }
    setTransactionDate(date.toDate());
    setDateText(date.format('MMM DD, YYYY'));
    setDatePickerVisible(false);
  };

  // Custom Header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate grid cells for pickerMonth
  const daysInMonth = pickerMonth.daysInMonth();
  const startDayOfWeek = pickerMonth.startOf('month').day();

  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ id: `empty-${i}`, isPlaceholder: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = pickerMonth.date(i);
    cells.push({
      id: `day-${i}`,
      date,
      dayNum: i,
      isPlaceholder: false,
    });
  }

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Toggle Selector for Expense vs Income */}
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, activeType === 'expense' ? styles.activeToggleTab : null]}
            onPress={() => setActiveType('expense')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeType === 'expense' ? styles.activeToggleTabText : null]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, activeType === 'income' ? styles.activeToggleTab : null]}
            onPress={() => setActiveType('income')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleTabText, activeType === 'income' ? styles.activeToggleTabText : null]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
 
        {/* Gemini AI Receipt Scanning Prompt Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ReceiptScanner')}
        >
          <View style={styles.aiBannerLeft}>
            <View style={styles.aiIconBox}>
              <Icon name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.aiBannerTextContainer}>
              <Text style={styles.aiBannerTitle}>Auto-fill with Gemini AI</Text>
              <Text style={styles.aiBannerSubtitle}>Scan a receipt photo or sample invoice</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Big Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountCurrencySymbol}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="850"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="numeric"
              style={styles.amountInput}
              autoFocus
            />
          </View>
        </View>

        {/* Form Fields Card */}
        <Card style={styles.formCard}>
          {/* Category Dropdown Picker Selector */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Categories', { isSelection: true, returnScreen: 'AddTransaction' })}
          >
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.fieldValueText}>{category}</Text>
              <Icon name="chevron-forward" size={16} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Date Picker Selector */}
          <TouchableOpacity 
            style={styles.fieldRow} 
            activeOpacity={0.8}
            onPress={() => {
              setPickerMonth(dayjs(transactionDate));
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.fieldValueText}>{dateText}</Text>
              <Icon name="calendar-outline" size={16} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Note Input */}
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Lunch at Restaurant"
              placeholderTextColor={colors.text.muted}
              style={styles.fieldValueInput}
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <PrimaryButton
            title="Save Expense"
            onPress={handleSave}
            loading={createMutation.isPending || updateMutation.isPending}
            style={styles.saveBtn}
          />
        </View>

        {/* Custom Calendar Date Picker Modal */}
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.pickerModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Month Navigation Control */}
              <View style={styles.pickerNavRow}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.pickerNavBtn}>
                  <Icon name="chevron-back" size={16} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.pickerMonthLabel}>
                  {pickerMonth.format('MMMM YYYY')}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.pickerNavBtn}>
                  <Icon name="chevron-forward" size={16} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Weekdays Row */}
              <View style={styles.pickerWeekdaysRow}>
                {weekdays.map(day => (
                  <Text key={day} style={styles.pickerWeekdayText}>{day}</Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.pickerGrid}>
                {cells.map((cell) => {
                  if (cell.isPlaceholder) {
                    return <View key={cell.id} style={styles.pickerCell} />;
                  }

                  const isSelected = dayjs(transactionDate).isSame(cell.date, 'day');
                  const isFuture = cell.date.isAfter(dayjs(), 'day');

                  return (
                    <TouchableOpacity
                      key={cell.id}
                      style={[
                        styles.pickerCell,
                        isSelected && styles.pickerSelectedCell,
                        isFuture && styles.pickerDisabledCell,
                      ]}
                      onPress={() => !isFuture && handleDateSelect(cell.date)}
                      activeOpacity={isFuture ? 1.0 : 0.7}
                    >
                      <Text
                        style={[
                          styles.pickerCellText,
                          isSelected && styles.pickerSelectedCellText,
                          isFuture && styles.pickerDisabledCellText,
                        ]}
                      >
                        {cell.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          </View>
        </Modal>

        <View style={{ height: 100 }} />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl * 1.5,
  },
  toggleTab: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggleTab: {
    backgroundColor: colors.secondary,
  },
  toggleTabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  activeToggleTabText: {
    color: colors.text.primary,
  },
  amountSection: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xxl,
  },
  amountLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCurrencySymbol: {
    fontSize: typography.sizes.display + 8,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.sizes.display + 12,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xxl,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    width: 80,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  fieldValueInput: {
    flex: 1,
    textAlign: 'right',
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    paddingVertical: 0,
    marginRight: spacing.xs,
  },
  fieldValueText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.xs,
  },
  saveContainer: {
    marginTop: spacing.md,
  },
  saveBtn: {
    width: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pickerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerMonthLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  pickerWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.bold,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    marginVertical: 1,
  },
  pickerCellText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  pickerSelectedCell: {
    backgroundColor: colors.primary,
  },
  pickerSelectedCellText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  pickerDisabledCell: {
    opacity: 0.25,
  },
  pickerDisabledCellText: {
    color: colors.text.muted,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(138, 63, 252, 0.06)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  aiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTextContainer: {
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  aiBannerSubtitle: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default AddTransactionScreen;
