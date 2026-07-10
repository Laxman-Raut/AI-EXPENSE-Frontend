import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useCreateTransaction, useUpdateTransaction, useTransaction } from '../../hooks/useTransactions';
import { Colors, Typography, Spacing } from '../../theme';
import { TransactionType, PaymentMethod } from '../../types';

const CATEGORIES = [
  { name: 'Food', icon: 'fast-food-outline' },
  { name: 'Transport', icon: 'car-outline' },
  { name: 'Shopping', icon: 'bag-outline' },
  { name: 'Entertainment', icon: 'game-controller-outline' },
  { name: 'Health', icon: 'heart-outline' },
  { name: 'Bills', icon: 'receipt-outline' },
  { name: 'Education', icon: 'school-outline' },
  { name: 'Salary', icon: 'cash-outline' },
  { name: 'Freelance', icon: 'laptop-outline' },
  { name: 'Investment', icon: 'trending-up-outline' },
  { name: 'Rent', icon: 'home-outline' },
  { name: 'Travel', icon: 'airplane-outline' },
];

const PAYMENT_METHODS: { name: PaymentMethod; icon: string }[] = [
  { name: 'UPI', icon: 'phone-portrait-outline' },
  { name: 'Cash', icon: 'cash-outline' },
  { name: 'Credit Card', icon: 'card-outline' },
  { name: 'Debit Card', icon: 'card-outline' },
  { name: 'Wallet', icon: 'wallet-outline' },
  { name: 'Bank Transfer', icon: 'business-outline' },
];

const AddTransactionScreen: React.FC<any> = ({ navigation, route }) => {
  const editId = route.params?.id;
  const isEditing = !!editId;

  const { data: existingTxn } = useTransaction(editId || '');
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && existingTxn) {
      setType(existingTxn.type);
      setCategory(existingTxn.category);
      setDescription(existingTxn.description);
      setAmount(existingTxn.amount.toString());
      setPaymentMethod(existingTxn.paymentMethod);
      setNote(existingTxn.note || '');
    }
  }, [existingTxn, isEditing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Select a category';
    if (!description || description.length < 3)
      newErrors.description = 'Description must be at least 3 characters';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = 'Enter a valid amount';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data = {
      type,
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      note: note || undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: editId, data });
        Alert.alert('Success', 'Transaction updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        Alert.alert('Success', 'Transaction added successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'expense' && styles.typeBtnExpense,
                ]}
                onPress={() => setType('expense')}>
                <Icon
                  name="arrow-up-outline"
                  size={18}
                  color={type === 'expense' ? Colors.expense : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'expense' && styles.typeTextExpense,
                  ]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'income' && styles.typeBtnIncome,
                ]}
                onPress={() => setType('income')}>
                <Icon
                  name="arrow-down-outline"
                  size={18}
                  color={type === 'income' ? Colors.income : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'income' && styles.typeTextIncome,
                  ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <InputField
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                error={errors.amount}
                containerStyle={styles.amountInput}
              />
            </View>

            {/* Category */}
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryItem,
                    category === cat.name && styles.categoryItemActive,
                  ]}
                  onPress={() => setCategory(cat.name)}>
                  <Icon
                    name={cat.icon}
                    size={22}
                    color={
                      category === cat.name ? Colors.primary : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.name && styles.categoryTextActive,
                    ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <InputField
              label="DESCRIPTION"
              placeholder="What was this for?"
              value={description}
              onChangeText={setDescription}
              leftIcon="create-outline"
              error={errors.description}
            />

            {/* Payment Method */}
            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.paymentScroll}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.name}
                  style={[
                    styles.paymentItem,
                    paymentMethod === pm.name && styles.paymentItemActive,
                  ]}
                  onPress={() => setPaymentMethod(pm.name)}>
                  <Icon
                    name={pm.icon}
                    size={18}
                    color={
                      paymentMethod === pm.name
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.paymentText,
                      paymentMethod === pm.name && styles.paymentTextActive,
                    ]}>
                    {pm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Note */}
            <InputField
              label="NOTE (OPTIONAL)"
              placeholder="Add a note..."
              value={note}
              onChangeText={setNote}
              leftIcon="document-text-outline"
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <PrimaryButton
              title={isEditing ? 'Update Transaction' : 'Add Transaction'}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius,
    padding: 4,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Spacing.borderRadiusSmall,
    gap: Spacing.sm,
  },
  typeBtnExpense: {
    backgroundColor: Colors.expenseBg,
  },
  typeBtnIncome: {
    backgroundColor: Colors.incomeBg,
  },
  typeText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  typeTextExpense: {
    color: Colors.expense,
  },
  typeTextIncome: {
    color: Colors.income,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  currencySymbol: {
    ...Typography.h1,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.base,
  },
  amountInput: {
    flex: 1,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadiusRound,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: Colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  paymentScroll: {
    marginBottom: Spacing.xl,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Spacing.borderRadiusRound,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  paymentItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: Colors.primary,
  },
  paymentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  paymentTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});

export default AddTransactionScreen;
