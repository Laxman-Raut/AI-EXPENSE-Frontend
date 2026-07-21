import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import {
  useCreateTransaction,
  useUpdateTransaction,
  useTransaction,
} from '../../hooks/useTransactions';
import { useAlert } from '../../context/AlertContext';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';

const EXPENSE_CATEGORIES = [
  { id: 'Food', name: 'Food', icon: 'fast-food', color: '#FF6B6B' },
  { id: 'Shopping', name: 'Shopping', icon: 'bag-handle', color: '#4ECDC4' },
  { id: 'Travel', name: 'Travel', icon: 'airplane', color: '#45B7D1' },
  { id: 'Grocery', name: 'Grocery', icon: 'cart', color: '#96CEB4' },
  { id: 'Rent', name: 'Rent', icon: 'home', color: '#FFEEAD' },
  { id: 'Investments', name: 'Investments', icon: 'trending-up', color: '#D4A5A5' },
  { id: 'Health', name: 'Health', icon: 'heart', color: '#FF9999' },
  { id: 'EMI/Bill', name: 'EMI/Bill', icon: 'receipt', color: '#99B898' },
  { id: 'Subscriptions', name: 'Subscriptions', icon: 'tv', color: '#FECEAB' },
  { id: 'Others', name: 'Others', icon: 'ellipsis-horizontal', color: '#A8E6CF' },
];

const INCOME_CATEGORIES = [
  { id: 'Salary', name: 'Salary', icon: 'cash', color: '#00D26A' },
  { id: 'Freelance / Business', name: 'Freelance / Business', icon: 'briefcase', color: '#4B8CFF' },
  { id: 'Investments', name: 'Investments', icon: 'trending-up', color: '#8A3FFC' },
  { id: 'Rental Income', name: 'Rental Income', icon: 'key', color: '#FFB648' },
  { id: 'Gifts & Rewards', name: 'Gifts & Rewards', icon: 'gift', color: '#FF6037' },
  { id: 'Refunds & Cashback', name: 'Refunds & Cashback', icon: 'trophy', color: '#FFD700' },
  { id: 'Dividends & Interest', name: 'Dividends & Interest', icon: 'pie-chart', color: '#00C9A7' },
  { id: 'Others', name: 'Others', icon: 'ellipsis-horizontal', color: '#A8E6CF' },
];

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: 'qr-code' },
  { id: 'Cash', label: 'Cash', icon: 'cash' },
  { id: 'Credit Card', label: 'Credit Card', icon: 'card' },
  { id: 'Debit Card', label: 'Debit Card', icon: 'card-outline' },
  { id: 'Wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'Bank Transfer', label: 'Bank', icon: 'business' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

const AddTransactionScreen = ({ navigation, route }) => {
  const transactionId = route.params?.id;
  const isEditing = !!transactionId;

  const { data: transactionDetails } = useTransaction(transactionId);
  const { showAlert } = useAlert();
  const { hasPremiumAccess, showPremiumAlert } = usePremiumAccess();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [activeType, setActiveType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [dateText, setDateText] = useState(dayjs().format('MMM DD, YYYY'));
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [dateShortcut, setDateShortcut] = useState('today'); // 'today' | 'yesterday' | 'custom'

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(dayjs());

  // Populate data when editing
  useEffect(() => {
    if (isEditing && transactionDetails) {
      setActiveType(transactionDetails.type || 'expense');
      setAmount(String(transactionDetails.amount || ''));
      setCategory(transactionDetails.category || 'Food');
      setPaymentMethod(transactionDetails.paymentMethod || 'UPI');
      setNotes(transactionDetails.description || '');
      if (transactionDetails.transactionDate) {
        const dateObj = new Date(transactionDetails.transactionDate);
        setTransactionDate(dateObj);
        setDateText(dayjs(dateObj).format('MMM DD, YYYY'));
        
        if (dayjs(dateObj).isSame(dayjs(), 'day')) {
          setDateShortcut('today');
        } else if (dayjs(dateObj).isSame(dayjs().subtract(1, 'day'), 'day')) {
          setDateShortcut('yesterday');
        } else {
          setDateShortcut('custom');
        }
      }
    }
  }, [transactionDetails, isEditing]);

  // Handle selected category returned from Categories screen selection
  useEffect(() => {
    if (route.params?.selectedCategory) {
      setCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  const handleQuickAmount = (val) => {
    const currentNum = Number(amount) || 0;
    setAmount(String(currentNum + val));
  };

  const handleShortcutDate = (shortcut) => {
    setDateShortcut(shortcut);
    if (shortcut === 'today') {
      const today = new Date();
      setTransactionDate(today);
      setDateText(dayjs(today).format('MMM DD, YYYY'));
    } else if (shortcut === 'yesterday') {
      const yest = dayjs().subtract(1, 'day').toDate();
      setTransactionDate(yest);
      setDateText(dayjs(yest).format('MMM DD, YYYY'));
    } else if (shortcut === 'custom') {
      setPickerMonth(dayjs(transactionDate));
      setDatePickerVisible(true);
    }
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Error', 'Please enter a valid amount.');
      return;
    }

    const payload = {
      type: activeType,
      category,
      amount: Number(amount),
      description: notes && notes.trim().length >= 2 ? notes.trim() : `${category} ${activeType}`,
      paymentMethod,
      note: notes,
      transactionDate: transactionDate.toISOString(),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transactionId, data: payload });
        showAlert('Success', 'Transaction updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createMutation.mutateAsync(payload);
        showAlert('Success', 'Transaction saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
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
    setDateShortcut('custom');
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
        <Icon name="close" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isEditing ? 'Edit Transaction' : 'New Transaction'}
      </Text>
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => {
          setAmount('');
          setNotes('');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.clearBtnText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calendar cells
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

  const isExpense = activeType === 'expense';
  const themeColor = isExpense ? colors.danger : colors.success;
  const categoriesList = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSwitchType = (type) => {
    setActiveType(type);
    if (!isEditing) {
      if (type === 'income') {
        setCategory('Salary');
      } else {
        setCategory('Food');
      }
    }
  };

  return (
    <View style={styles.root}>
      <Screen scrollable header={renderHeader()} style={styles.contentContainer}>
        {/* Type Segmented Control (Expense vs Income) */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentTab, isExpense && styles.activeExpenseSegment]}
            onPress={() => handleSwitchType('expense')}
            activeOpacity={0.8}
          >
            <Icon
              name="arrow-down-circle"
              size={18}
              color={isExpense ? colors.danger : colors.text.secondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, isExpense && styles.activeExpenseText]}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, !isExpense && styles.activeIncomeSegment]}
            onPress={() => handleSwitchType('income')}
            activeOpacity={0.8}
          >
            <Icon
              name="arrow-up-circle"
              size={18}
              color={!isExpense ? colors.success : colors.text.secondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, !isExpense && styles.activeIncomeText]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Receipt Scanner Card */}
        <TouchableOpacity
          style={[styles.aiBanner, !hasPremiumAccess && { opacity: 0.85 }]}
          activeOpacity={0.85}
          onPress={() => {
            if (hasPremiumAccess) {
              navigation.navigate('ReceiptScanner');
            } else {
              showPremiumAlert();
            }
          }}
        >
          <View style={styles.aiBannerLeft}>
            <LinearGradient
              colors={['#8A3FFC', '#5E1BDB']}
              style={styles.aiIconBox}
            >
              <Icon name="sparkles" size={16} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.aiBannerTextContainer}>
              <View style={styles.aiBannerTitleRow}>
                <Text style={styles.aiBannerTitle}>Auto-Fill via AI Scanner</Text>
                {!hasPremiumAccess && (
                  <View style={styles.proLabel}>
                    <Text style={styles.proLabelText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.aiBannerSubtitle}>
                Scan paper receipt or PDF invoice to auto-extract details
              </Text>
            </View>
          </View>
          <Icon
            name={hasPremiumAccess ? 'chevron-forward' : 'lock-closed'}
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Hero Amount Card */}
        <View
          style={[
            styles.heroAmountCard,
            { borderColor: isExpense ? 'rgba(255, 77, 103, 0.3)' : 'rgba(0, 210, 106, 0.3)' },
          ]}
        >
          <Text style={styles.amountLabel}>AMOUNT</Text>

          <View style={styles.amountInputRow}>
            <Text style={[styles.amountSymbol, { color: themeColor }]}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="rgba(255, 255, 255, 0.2)"
              keyboardType="numeric"
              style={[styles.amountInput, { color: themeColor }]}
              autoFocus
            />
          </View>

          {/* Quick Amount Addition Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsContainer}
          >
            {QUICK_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickChip}
                onPress={() => handleQuickAmount(val)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>+₹{val}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Selection Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Categories', {
                isSelection: true,
                type: activeType,
                onCategorySelect: (selectedCat) => setCategory(selectedCat),
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>All Categories ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {categoriesList.map((item) => {
            const isSelected = category === item.name;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryCard,
                  isSelected && {
                    borderColor: themeColor,
                    backgroundColor: isExpense
                      ? 'rgba(255, 77, 103, 0.12)'
                      : 'rgba(0, 210, 106, 0.12)',
                  },
                ]}
                onPress={() => setCategory(item.name)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.categoryIconBadge,
                    { backgroundColor: isSelected ? themeColor : 'rgba(255, 255, 255, 0.06)' },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : item.color || colors.text.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && { color: themeColor, fontWeight: typography.weights.bold },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Method Section */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Payment Method</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.paymentMethodsRow}
        >
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = paymentMethod === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentPill,
                  isSelected && {
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(138, 63, 252, 0.15)',
                  },
                ]}
                onPress={() => setPaymentMethod(pm.id)}
                activeOpacity={0.75}
              >
                <Icon
                  name={pm.icon}
                  size={16}
                  color={isSelected ? colors.primaryLight : colors.text.secondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.paymentPillText,
                    isSelected && { color: '#FFFFFF', fontWeight: typography.weights.bold },
                  ]}
                >
                  {pm.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date Selector Section */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Transaction Date</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateChip, dateShortcut === 'today' && styles.activeDateChip]}
            onPress={() => handleShortcutDate('today')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dateChipText,
                dateShortcut === 'today' && styles.activeDateChipText,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateChip, dateShortcut === 'yesterday' && styles.activeDateChip]}
            onPress={() => handleShortcutDate('yesterday')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dateChipText,
                dateShortcut === 'yesterday' && styles.activeDateChipText,
              ]}
            >
              Yesterday
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateChip,
              styles.datePickerBtn,
              dateShortcut === 'custom' && styles.activeDateChip,
            ]}
            onPress={() => handleShortcutDate('custom')}
            activeOpacity={0.75}
          >
            <Icon
              name="calendar-outline"
              size={16}
              color={dateShortcut === 'custom' ? '#FFFFFF' : colors.text.secondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.dateChipText,
                dateShortcut === 'custom' && styles.activeDateChipText,
              ]}
            >
              {dateText}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes & Description Card */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Note / Description</Text>
        <Card style={styles.notesCard}>
          <Icon name="create-outline" size={20} color={colors.text.secondary} style={{ marginRight: 10 }} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Dinner with friends, Uber to work..."
            placeholderTextColor={colors.text.muted}
            style={styles.notesInput}
          />
          {notes ? (
            <TouchableOpacity onPress={() => setNotes('')}>
              <Icon name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </Card>

        {/* Save Transaction Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isExpense
                  ? ['#FF4D67', '#FF6037']
                  : ['#00D26A', '#00B853']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientSaveBtn}
            >
              <Icon
                name={isEditing ? "checkmark-circle" : "add-circle"}
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.saveBtnText}>
                {isEditing
                  ? 'Update Transaction'
                  : isExpense
                  ? 'Save Expense'
                  : 'Save Income'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
                {weekdays.map((day) => (
                  <Text key={day} style={styles.pickerWeekdayText}>
                    {day}
                  </Text>
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
    paddingTop: spacing.xs,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearBtnText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  segmentTab: {
    flex: 1,
    height: 42,
    borderRadius: radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  activeExpenseSegment: {
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.5)',
  },
  activeExpenseText: {
    color: colors.danger,
    fontWeight: typography.weights.bold,
  },
  activeIncomeSegment: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.5)',
  },
  activeIncomeText: {
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(138, 63, 252, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.3)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  aiBannerTextContainer: {
    flex: 1,
  },
  aiBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBannerTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  aiBannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  proLabel: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  heroAmountCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  amountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  amountSymbol: {
    fontSize: typography.sizes.display + 12,
    fontWeight: typography.weights.bold,
    marginRight: 4,
  },
  amountInput: {
    fontSize: typography.sizes.display + 16,
    fontWeight: typography.weights.bold,
    paddingVertical: 0,
    minWidth: 120,
    textAlign: 'center',
  },
  quickChipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  quickChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  seeAllText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.primaryLight,
    fontWeight: typography.weights.semibold,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentPillText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dateChip: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  datePickerBtn: {
    flex: 1.4,
  },
  activeDateChip: {
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  activeDateChipText: {
    color: colors.primaryLight,
    fontWeight: typography.weights.bold,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  notesInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    paddingVertical: 0,
  },
  saveContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  gradientSaveBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
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
    opacity: 0.2,
  },
  pickerDisabledCellText: {
    color: colors.text.muted,
  },
});

export default AddTransactionScreen;
