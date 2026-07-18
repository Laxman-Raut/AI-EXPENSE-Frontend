import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, radius, typography } from '../../theme';
import { useAlert } from '../../context/AlertContext';
import {
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useRecurringTransaction,
} from '../../hooks/useRecurringTransactions';
import dayjs from 'dayjs';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Wallet', 'Bank Transfer'];

const AddEditRecurringScreen = ({ navigation, route }) => {
  const recurringId = route.params?.id;
  const isEditing = !!recurringId;
  const { showAlert } = useAlert();

  // Queries and mutations
  const { data: recurringData, isLoading: fetchLoading } = useRecurringTransaction(recurringId);
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();

  // Form states
  const [activeType, setActiveType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [startDate, setStartDate] = useState(new Date());
  const [note, setNote] = useState('');

  // Date picker states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(dayjs());
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Payment method selector state
  const [payMethodVisible, setPayMethodVisible] = useState(false);

  // Populate data when editing
  useEffect(() => {
    if (isEditing && recurringData) {
      setActiveType(recurringData.type);
      setAmount(String(recurringData.amount));
      setCategory(recurringData.category);
      setDescription(recurringData.description);
      setFrequency(recurringData.frequency);
      setPaymentMethod(recurringData.paymentMethod || 'UPI');
      setStartDate(new Date(recurringData.startDate));
      setNote(recurringData.note || '');
    }
  }, [isEditing, recurringData]);

  // Sync category selection callback from route.params
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
    if (!description.trim()) {
      showAlert('Error', 'Please enter a description (e.g. Rent, Subscription).');
      return;
    }
    if (!category) {
      showAlert('Error', 'Please select a category.');
      return;
    }

    const payload = {
      type: activeType,
      amount: Number(amount),
      category,
      description: description.trim(),
      frequency,
      paymentMethod,
      startDate: startDate.toISOString(),
      note: note.trim(),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: recurringId, data: payload });
        showAlert('Success', 'Recurring template updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createMutation.mutateAsync(payload);
        showAlert('Success', 'Recurring template created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      showAlert('Error', error.message || 'Something went wrong.');
    }
  };

  // Date picker handlers
  const handlePrevMonth = () => setPickerMonth(pickerMonth.subtract(1, 'month'));
  const handleNextMonth = () => setPickerMonth(pickerMonth.add(1, 'month'));
  const handleDateSelect = (date) => {
    setStartDate(date.toDate());
    setDatePickerVisible(false);
  };

  // Generate calendar grid
  const daysInMonth = pickerMonth.daysInMonth();
  const startDayOfWeek = pickerMonth.startOf('month').day();
  const cells = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ id: `placeholder-${i}`, isPlaceholder: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const date = pickerMonth.date(i);
    cells.push({
      id: `day-${i}`,
      isPlaceholder: false,
      dayNum: i,
      date,
    });
  }

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
      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Recurring Job' : 'Add Recurring Job'}
      </Text>
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        header={renderHeader()}
        style={styles.contentContainer}
        loading={fetchLoading}
      >
        {/* Recurring transaction template defaults to Expense */}

        {/* Amount Input Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountCurrencySymbol}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="1000"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* Frequency Chips Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Execution Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqChip, frequency === f ? styles.activeFreqChip : null]}
                onPress={() => setFrequency(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.freqChipText, frequency === f ? styles.activeFreqChipText : null]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Fields Card */}
        <Card style={styles.formCard}>
          {/* Description Input */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Office Rent, Netflix Subscription"
              placeholderTextColor={colors.text.muted}
              style={styles.fieldValueInput}
            />
          </View>

          {/* Category Dropdown Picker */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Categories', {
                isSelection: true,
                onCategorySelect: (selectedCat) => setCategory(selectedCat),
              })
            }
          >
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.fieldValueText}>{category}</Text>
              <Icon name="chevron-forward" size={16} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Start Date Picker */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.8}
            onPress={() => {
              setPickerMonth(dayjs(startDate));
              setDatePickerVisible(true);
            }}
          >
            <Text style={styles.fieldLabel}>Start Date</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.fieldValueText}>{dayjs(startDate).format('DD MMMM YYYY')}</Text>
              <Icon name="calendar-outline" size={16} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Payment Method Selector */}
          <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.8}
            onPress={() => setPayMethodVisible(true)}
          >
            <Text style={styles.fieldLabel}>Method</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.fieldValueText}>{paymentMethod}</Text>
              <Icon name="chevron-down-outline" size={16} color={colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {/* Note Input */}
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional notes"
              placeholderTextColor={colors.text.muted}
              style={styles.fieldValueInput}
            />
          </View>
        </Card>

        {/* Action Button */}
        <View style={styles.saveContainer}>
          <PrimaryButton
            title={isEditing ? 'Update Template' : 'Start Automation'}
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
                <Text style={styles.modalTitle}>Select Start Date</Text>
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

                  const isSelected = dayjs(startDate).isSame(cell.date, 'day');

                  return (
                    <TouchableOpacity
                      key={cell.id}
                      style={[
                        styles.pickerCell,
                        isSelected && styles.pickerSelectedCell,
                      ]}
                      onPress={() => handleDateSelect(cell.date)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerCellText,
                          isSelected && styles.pickerSelectedCellText,
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

        {/* Payment Method Selector Dropdown Modal */}
        <Modal
          visible={payMethodVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPayMethodVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.pickerModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Method</Text>
                <TouchableOpacity onPress={() => setPayMethodVisible(false)}>
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.methodList}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodRow,
                      paymentMethod === method && styles.activeMethodRow,
                    ]}
                    onPress={() => {
                      setPaymentMethod(method);
                      setPayMethodVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        paymentMethod === method && styles.activeMethodText,
                      ]}
                    >
                      {method}
                    </Text>
                    {paymentMethod === method && (
                      <Icon name="checkmark-sharp" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.xl,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeToggleTab: {
    backgroundColor: colors.surface,
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
  },
  activeToggleTabText: {
    color: colors.text.primary,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl * 1.2,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCurrencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text.primary,
    minWidth: 120,
    textAlign: 'left',
    paddingVertical: 0,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  freqChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFreqChip: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  freqChipText: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '600',
  },
  activeFreqChipText: {
    color: colors.primary,
  },
  formCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 90,
  },
  fieldValueInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    paddingVertical: 0,
    textAlign: 'right',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldValueText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  saveContainer: {
    marginTop: spacing.md,
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerModalContent: {
    width: '100%',
    padding: spacing.lg,
    maxHeight: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerMonthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pickerWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xs,
  },
  pickerWeekdayText: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 8,
  },
  pickerCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCellText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  pickerSelectedCell: {
    backgroundColor: colors.primary,
  },
  pickerSelectedCellText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  methodList: {
    marginTop: spacing.xs,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activeMethodRow: {
    borderBottomColor: colors.primary + '50',
  },
  methodText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  activeMethodText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default AddEditRecurringScreen;
