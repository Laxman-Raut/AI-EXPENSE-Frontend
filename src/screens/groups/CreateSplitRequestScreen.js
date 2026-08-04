import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useGroupSplitRequests } from '../../hooks/useSplitRequests';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, getCurrencySymbol } from '../../utils/formatCurrency';
import { useAlert } from '../../context/AlertContext';

const SPLIT_TYPES = [
  { key: 'equal', label: 'Equal', icon: 'calculator-outline' },
  { key: 'exact', label: 'Exact', icon: 'cash-outline' },
  { key: 'percentage', label: '% Percentage', icon: 'pie-chart-outline' },
  { key: 'shares', label: 'Shares', icon: 'pie-chart-outline' },
];

const DUE_OPTIONS = [
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days' },
  { days: 14, label: '14 Days' },
  { days: 30, label: '30 Days' },
];

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'U';

const AvatarCircle = ({ name, avatar, size = 36 }) => {
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

const CreateSplitRequestScreen = ({ route, navigation }) => {
  const { group } = route.params || {};
  const members = group?.members || [];
  const { user } = useAuth();
  const currentUserId = String(user?._id || user?.id || '');
  const { showAlert } = useAlert();

  const defaultPaidBy = useMemo(() => {
    const foundMe = members.find((m) => String(m._id || m.id) === currentUserId);
    if (foundMe) {
      return String(foundMe._id || foundMe.id);
    }
    return String(members[0]?._id || members[0]?.id || '');
  }, [members, currentUserId]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState(defaultPaidBy);
  const [splitType, setSplitType] = useState('equal');
  const [dueDays, setDueDays] = useState(7);

  // Participants selection state: map memberId -> { selected, amount, percentage, shares }
  const [participantState, setParticipantState] = useState(() => {
    const initial = {};
    members.forEach((m) => {
      const id = String(m._id || m.id || m);
      if (id) {
        initial[id] = { selected: true, amount: '', percentage: '', shares: '1' };
      }
    });
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);
  const { createSplit } = useGroupSplitRequests(group?._id);

  const selectedMemberIds = useMemo(
    () => Object.keys(participantState).filter((id) => participantState[id]?.selected),
    [participantState]
  );

  const parsedTotal = parseFloat(totalAmount) || 0;

  // Equal share preview
  const equalShare = useMemo(() => {
    if (!parsedTotal || selectedMemberIds.length === 0) return '0.00';
    return (parsedTotal / selectedMemberIds.length).toFixed(2);
  }, [parsedTotal, selectedMemberIds]);

  const toggleParticipant = (memberId) => {
    setParticipantState((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        selected: !prev[memberId]?.selected,
      },
    }));
  };

  const updateParticipantVal = (memberId, field, val) => {
    setParticipantState((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: val,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert('Required Field', 'Please enter an expense title.', [{ text: 'OK' }], 'warning');
      return;
    }
    if (!parsedTotal || parsedTotal <= 0) {
      showAlert('Required Field', 'Please enter a valid amount.', [{ text: 'OK' }], 'warning');
      return;
    }
    if (!paidBy) {
      showAlert('Required Field', 'Please select who paid for the expense.', [{ text: 'OK' }], 'warning');
      return;
    }
    if (selectedMemberIds.length < 1) {
      showAlert('Selection Error', 'Select at least one participant.', [{ text: 'OK' }], 'warning');
      return;
    }

    // Build participants array for backend
    const participantsPayload = selectedMemberIds.map((id) => {
      const p = participantState[id];
      return {
        user: id,
        amount: splitType === 'exact' ? parseFloat(p.amount) || 0 : 0,
        percentage: splitType === 'percentage' ? parseFloat(p.percentage) || 0 : 0,
        shares: splitType === 'shares' ? parseInt(p.shares, 10) || 1 : 1,
      };
    });

    // Validate totals for Exact & Percentage
    if (splitType === 'exact') {
      const sumExact = participantsPayload.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(sumExact - parsedTotal) > 0.5) {
        showAlert(
          'Split Error',
          `Sum of exact amounts (${getCurrencySymbol()}${sumExact.toFixed(2)}) must equal total amount (${getCurrencySymbol()}${parsedTotal.toFixed(2)}).`,
          [{ text: 'OK' }],
          'warning'
        );
        return;
      }
    } else if (splitType === 'percentage') {
      const sumPct = participantsPayload.reduce((sum, p) => sum + p.percentage, 0);
      if (Math.abs(sumPct - 100) > 0.5) {
        showAlert('Split Error', `Sum of percentages (${sumPct}%) must equal 100%.`, [{ text: 'OK' }], 'warning');
        return;
      }
    }

    const calculatedDueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);

    setSubmitting(true);
    try {
      await createSplit({
        group: group._id,
        title: title.trim(),
        description: description.trim(),
        totalAmount: parsedTotal,
        amount: parsedTotal,
        paidBy,
        splitType,
        currency: user?.currency || 'INR',
        dueDate: calculatedDueDate,
        participants: participantsPayload,
      });
      showAlert(
        'Split Expense Created! 🎉',
        'Split request has been sent to group members & transactions recorded successfully.',
        [
          {
            text: 'Done 👍',
            onPress: () => navigation.goBack(),
          },
        ],
        'success'
      );
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create split expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Google Pay Split</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Expense Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Expense Title <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Icon name="receipt-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Dinner at Restaurant, Grocery Bill"
                placeholderTextColor={colors.text.muted}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          {/* Amount & Paid By */}
          <View style={styles.rowTwo}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                Total Amount ({getCurrencySymbol()}) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="decimal-pad"
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                />
              </View>
            </View>
          </View>

          {/* Due Date Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Due Date / Settlement Time</Text>
            <View style={styles.dueRow}>
              {DUE_OPTIONS.map((opt) => {
                const isSelected = dueDays === opt.days;
                return (
                  <TouchableOpacity
                    key={opt.days}
                    style={[
                      styles.dueChip,
                      isSelected && styles.dueChipSelected,
                    ]}
                    onPress={() => setDueDays(opt.days)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="calendar-outline"
                      size={14}
                      color={isSelected ? '#fff' : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.dueChipText,
                        isSelected && styles.dueChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Paid By Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Paid By</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.payerRow}
            >
              {members.map((member) => {
                const memberId = member._id || member.id;
                const isSelected = paidBy === memberId;
                return (
                  <TouchableOpacity
                    key={memberId}
                    style={[
                      styles.payerChip,
                      isSelected && styles.payerChipSelected,
                    ]}
                    onPress={() => setPaidBy(memberId)}
                    activeOpacity={0.7}
                  >
                    <AvatarCircle name={member.fullName} avatar={member.avatar} size={28} />
                    <Text
                      style={[
                        styles.payerChipText,
                        isSelected && styles.payerChipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {member.fullName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type Selector */}
          <Text style={styles.label}>Split Method</Text>
          <View style={styles.splitTypeRow}>
            {SPLIT_TYPES.map((type) => {
              const isSelected = splitType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.splitTypeBtn,
                    isSelected && styles.splitTypeBtnSelected,
                  ]}
                  onPress={() => setSplitType(type.key)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={type.icon}
                    size={16}
                    color={isSelected ? '#fff' : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.splitTypeLabel,
                      isSelected && styles.splitTypeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Participants Breakdown Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Participants ({selectedMemberIds.length})</Text>
            {splitType === 'equal' && (
              <Text style={styles.equalShareText}>{getCurrencySymbol()}{equalShare} / person</Text>
            )}
          </View>

          {members.map((member) => {
            const memberId = member._id || member.id;
            const pState = participantState[memberId] || {};
            const isSelected = pState.selected;

            return (
              <View key={memberId} style={styles.participantCard}>
                <TouchableOpacity
                  style={styles.participantLeft}
                  onPress={() => toggleParticipant(memberId)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.text.muted}
                  />
                  <AvatarCircle name={member.fullName} avatar={member.avatar} size={36} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.participantName}>{member.fullName}</Text>
                    {splitType === 'equal' && isSelected && (
                      <Text style={styles.participantSub}>Owes {getCurrencySymbol()}{equalShare}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Custom input fields for non-equal splits */}
                {isSelected && splitType !== 'equal' && (
                  <View style={styles.customInputContainer}>
                    {splitType === 'exact' && (
                      <View style={styles.smallInputWrapper}>
                        <Text style={styles.smallCurrency}>{getCurrencySymbol()}</Text>
                        <TextInput
                          style={styles.smallInput}
                          placeholder="0.00"
                          placeholderTextColor={colors.text.muted}
                          keyboardType="decimal-pad"
                          value={pState.amount}
                          onChangeText={(v) => updateParticipantVal(memberId, 'amount', v)}
                        />
                      </View>
                    )}

                    {splitType === 'percentage' && (
                      <View style={styles.smallInputWrapper}>
                        <TextInput
                          style={styles.smallInput}
                          placeholder="0"
                          placeholderTextColor={colors.text.muted}
                          keyboardType="number-pad"
                          value={pState.percentage}
                          onChangeText={(v) => updateParticipantVal(memberId, 'percentage', v)}
                        />
                        <Text style={styles.smallSymbol}>%</Text>
                      </View>
                    )}

                    {splitType === 'shares' && (
                      <View style={styles.smallInputWrapper}>
                        <TextInput
                          style={styles.smallInput}
                          placeholder="1"
                          placeholderTextColor={colors.text.muted}
                          keyboardType="number-pad"
                          value={pState.shares}
                          onChangeText={(v) => updateParticipantVal(memberId, 'shares', v)}
                        />
                        <Text style={styles.smallSymbol}>shares</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="paper-plane-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>Request & Record Expense</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl || 40,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes?.sm || 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  currencySymbol: {
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes?.md || 15,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dueRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dueChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  dueChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dueChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  dueChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  payerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  payerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  payerChipSelected: {
    backgroundColor: colors.primary + '25',
    borderColor: colors.primary,
  },
  payerChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  payerChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  splitTypeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    padding: 4,
    marginBottom: spacing.lg,
    gap: 4,
  },
  splitTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md || 10,
    gap: 4,
  },
  splitTypeBtnSelected: {
    backgroundColor: colors.primary,
  },
  splitTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  splitTypeLabelSelected: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  equalShareText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg || 14,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  participantLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    color: '#fff',
  },
  participantName: {
    fontSize: typography.sizes?.sm || 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  participantSub: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  customInputContainer: {
    marginLeft: spacing.sm,
  },
  smallInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md || 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    height: 36,
  },
  smallCurrency: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginRight: 2,
  },
  smallSymbol: {
    fontSize: 11,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  smallInput: {
    color: colors.text.primary,
    fontSize: 13,
    width: 50,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: radius.lg || 14,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.xs,
  },
  submitText: {
    color: '#fff',
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
  },
});

export default CreateSplitRequestScreen;
