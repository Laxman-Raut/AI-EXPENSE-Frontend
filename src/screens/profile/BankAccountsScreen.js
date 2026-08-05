import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import useBanks from '../../hooks/useBanks';
import Snackbar from '../../components/Snackbar';

const POPULAR_BANKS = [
  { name: 'State Bank of India', code: 'SBIN', icon: 'account-balance' },
  { name: 'HDFC Bank', code: 'HDFC', icon: 'account-balance' },
  { name: 'ICICI Bank', code: 'ICIC', icon: 'account-balance' },
  { name: 'Axis Bank', code: 'UTIB', icon: 'account-balance' },
  { name: 'Punjab National Bank', code: 'PUNB', icon: 'account-balance' },
  { name: 'Kotak Mahindra Bank', code: 'KKBK', icon: 'account-balance' },
  { name: 'Bank of Baroda', code: 'BARB', icon: 'account-balance' },
];

const BankAccountsScreen = ({ navigation }) => {
  const { banks, loading, refetch, addBank, editBank, removeBank, makePrimary } = useBanks();

  // Auto refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch(true);
    }, [refetch])
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [nickname, setNickname] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ visible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  const resetForm = () => {
    setBankName('');
    setBankCode('');
    setAccountHolderName('');
    setAccountNumber('');
    setAccountType('Savings');
    setNickname('');
    setUpiId('');
    setIsPrimary(false);
    setEditingBank(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (bank) => {
    setEditingBank(bank);
    setBankName(bank.bankName || '');
    setBankCode(bank.bankCode || '');
    setAccountHolderName(bank.accountHolderName || '');
    setAccountNumber(bank.accountNumber || '');
    setAccountType(bank.accountType || 'Savings');
    setNickname(bank.nickname || '');
    setUpiId(bank.upiId || '');
    setIsPrimary(Boolean(bank.isPrimary));
    setModalVisible(true);
  };

  const handleSaveBank = async () => {
    if (!bankName.trim()) {
      Alert.alert('Required Field', 'Please enter bank name.');
      return;
    }
    if (!accountHolderName.trim()) {
      Alert.alert('Required Field', 'Please enter account holder name.');
      return;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Required Field', 'Please enter account number.');
      return;
    }
    if (!/^[0-9]{9,18}$/.test(accountNumber.trim())) {
      Alert.alert('Invalid Input', 'Account number must be between 9 and 18 digits.');
      return;
    }

    if (upiId.trim() && !/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      Alert.alert('Invalid Input', 'Please enter a valid UPI ID (e.g. name@upi).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bankName: bankName.trim(),
        bankCode: bankCode.trim().toUpperCase() || bankName.trim().substring(0, 4).toUpperCase(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        nickname: nickname.trim() || undefined,
        upiId: upiId.trim() || undefined,
        isPrimary,
      };

      if (editingBank) {
        await editBank(editingBank._id, payload);
        showSnackbar('Bank account updated successfully!', 'success');
      } else {
        await addBank(payload);
        showSnackbar('Bank account added successfully!', 'success');
      }
      setModalVisible(false);
      resetForm();
    } catch (err) {
      const errMsg =
        err?.response?.data?.errors?.join('\n') ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save bank details';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBank = (bank) => {
    Alert.alert(
      'Delete Bank Account',
      `Are you sure you want to remove ${bank.bankName} (${maskAccountNumber(bank.accountNumber)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeBank(bank._id);
              showSnackbar('Bank account removed.', 'info');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete bank account.');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (id) => {
    try {
      await makePrimary(id);
      showSnackbar('Primary bank account updated!', 'success');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to set primary bank.');
    }
  };

  const maskAccountNumber = (accNo = '') => {
    if (accNo.length <= 4) return accNo;
    return '•••• ' + accNo.slice(-4);
  };

  const renderBankCard = ({ item }) => {
    const isPrimaryAccount = Boolean(item.isPrimary);

    return (
      <Card style={[styles.bankCard, isPrimaryAccount && styles.primaryCardBorder]}>
        <View style={styles.cardHeader}>
          <BankLogo bankName={item.bankName} size={40} />
          <View style={styles.bankMeta}>
            <View style={styles.bankTitleRow}>
              <Text style={styles.bankName}>{item.bankName}</Text>
              {isPrimaryAccount && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
            </View>
            <Text style={styles.accountNoText}>
              {item.accountType} · {maskAccountNumber(item.accountNumber)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Icon name="pencil" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Holder:</Text>
            <Text style={styles.detailVal}>{item.accountHolderName}</Text>
          </View>
          {item.upiId ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>UPI ID:</Text>
              <Text style={styles.detailValUpi}>{item.upiId}</Text>
            </View>
          ) : null}
          {item.nickname ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nickname:</Text>
              <Text style={styles.detailVal}>{item.nickname}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          {!isPrimaryAccount && (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => handleSetPrimary(item._id)}
              activeOpacity={0.75}
            >
              <Icon name="star-outline" size={14} color={colors.primary} />
              <Text style={styles.actionBtnSecondaryText}>Set Primary</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtnDelete}
            onPress={() => handleDeleteBank(item)}
            activeOpacity={0.75}
          >
            <Icon name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.actionBtnDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Icon name="arrow-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bank Accounts</Text>
      <TouchableOpacity
        style={styles.addBtnHeader}
        onPress={openAddModal}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Icon name="add" size={26} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen header={renderHeader()} style={styles.contentContainer}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your bank accounts...</Text>
          </View>
        ) : banks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Icon name="card-outline" size={48} color={colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>No Bank Accounts Added</Text>
            <Text style={styles.emptySub}>
              Link your bank details and UPI ID to streamline reimbursements and expense splitting.
            </Text>
            <TouchableOpacity style={styles.addBankBtnPrimary} onPress={openAddModal} activeOpacity={0.85}>
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addBankBtnPrimaryText}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={banks}
            keyExtractor={(item) => item._id}
            renderItem={renderBankCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={loading}
          />
        )}

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoidingView}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={styles.modalContent}
                onPress={(e) => {
                  e.stopPropagation?.();
                }}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon name="close" size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Popular Bank Selector (Only when adding) */}
                  {!editingBank && (
                    <View style={styles.popularSection}>
                      <Text style={styles.sectionSubLabel}>Select Popular Bank</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
                        {POPULAR_BANKS.map((b) => (
                          <TouchableOpacity
                            key={b.code}
                            style={[
                              styles.popularChip,
                              bankName === b.name && styles.popularChipSelected,
                            ]}
                            onPress={() => {
                              setBankName(b.name);
                              setBankCode(b.code);
                            }}
                          >
                            <Text
                              style={[
                                styles.popularChipText,
                                bankName === b.name && styles.popularChipTextSelected,
                              ]}
                            >
                              {b.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>
                    Bank Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.inputLabel}>
                    Account Holder Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    placeholder="Full name as in bank"
                    placeholderTextColor={colors.text.muted}
                  />

                  <Text style={styles.inputLabel}>
                    Account Number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="9 to 18 digit account number"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>Account Type</Text>
                  <View style={styles.typeRow}>
                    {['Savings', 'Current'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeBtn,
                          accountType === type && styles.typeBtnSelected,
                        ]}
                        onPress={() => setAccountType(type)}
                      >
                        <Text
                          style={[
                            styles.typeBtnText,
                            accountType === type && styles.typeBtnTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>UPI ID (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. name@upi or mobile@paytm"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Nickname / Label (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g. Salary Account, Personal Savings"
                    placeholderTextColor={colors.text.muted}
                  />

                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                  ) : (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBank} activeOpacity={0.85}>
                      <Text style={styles.saveBtnText}>
                        {editingBank ? 'Save Changes' : 'Add Bank Account'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </Modal>

        <Snackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type={snackbar.type}
          onDismiss={hideSnackbar}
        />
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  backBtn: {
    padding: spacing.xs,
  },
  addBtnHeader: {
    padding: spacing.xs,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  bankCard: {
    padding: spacing.md,
    borderRadius: radius.lg || 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryCardBorder: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  accountNoText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  moreBtn: {
    padding: spacing.xs || 8,
  },
  cardDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detailValUpi: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    gap: 4,
  },
  actionBtnDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  addBankBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    gap: 8,
  },
  addBankBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBody: {
    marginBottom: spacing.xs,
  },
  popularSection: {
    marginBottom: spacing.md,
  },
  sectionSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  popularScroll: {
    flexDirection: 'row',
  },
  popularChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  popularChipSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  popularChipText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  popularChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  required: {
    color: colors.danger,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md || 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
    fontSize: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md || 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  typeBtnTextSelected: {
    color: colors.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md || 12,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BankAccountsScreen;
