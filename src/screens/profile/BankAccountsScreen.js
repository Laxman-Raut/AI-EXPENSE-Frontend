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
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import { colors, spacing, typography, radius } from '../../theme';
import useBanks from '../../hooks/useBanks';
import Snackbar from '../../components/Snackbar';
import BankLogo from '../../components/atoms/BankLogo';

const POPULAR_BANKS = [
  { name: 'State Bank of India', code: 'SBIN', icon: 'account-balance' },
  { name: 'HDFC Bank', code: 'HDFC', icon: 'account-balance' },
  { name: 'ICICI Bank', code: 'ICIC', icon: 'account-balance' },
  { name: 'Axis Bank', code: 'UTIB', icon: 'account-balance' },
  { name: 'Punjab National Bank', code: 'PUNB', icon: 'account-balance' },
  { name: 'Kotak Mahindra Bank', code: 'KKBK', icon: 'account-balance' },
  { name: 'Bank of Baroda', code: 'BARB', icon: 'account-balance' },
  { name: 'Paytm Bank', code: 'PAYTM', icon: 'account-balance' },
];

const BankAccountsScreen = ({ navigation }) => {
  const { banks, loading, refetch, addBank, editBank, removeBank, makePrimary } = useBanks();



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
    return '•••• •••• ' + accNo.slice(-4);
  };

  const primaryBank = banks.find((b) => b.isPrimary) || banks[0];

  const renderBankCard = ({ item }) => {
    const isPrimaryAccount = Boolean(item.isPrimary);
    const last4 = item.accountNumber ? item.accountNumber.slice(-4) : '••••';

    return (
      <LinearGradient
        colors={
          isPrimaryAccount
            ? ['#1A2238', '#0F1626', '#090E1B']
            : ['#171B2B', '#111422', '#0A0C16']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.metallicCard,
          isPrimaryAccount && styles.primaryMetallicBorder,
        ]}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.bankLogoGroup}>
            <BankLogo bankName={item.bankName} size={42} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={styles.bankNameText} numberOfLines={1}>
                {item.bankName}
              </Text>
              <Text style={styles.accountTypeSubtext}>
                {item.accountType || 'Savings'} Account
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {isPrimaryAccount ? (
              <View style={styles.primaryBadge}>
                <Icon name="checkmark-circle" size={12} color="#00D26A" style={{ marginRight: 3 }} />
                <Text style={styles.primaryBadgeText}>PRIMARY</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.setPrimaryPill}
                onPress={() => handleSetPrimary(item._id)}
                activeOpacity={0.75}
              >
                <Icon name="star-outline" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                <Text style={styles.setPrimaryPillText}>Set Primary</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.iconEditBtn}
              onPress={() => openEditModal(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="create-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Embossed Account Number */}
        <View style={styles.accNumberWrapper}>
          <Text style={styles.accNumberLabel}>ACCOUNT NUMBER</Text>
          <Text style={styles.accNumberEmbossed}>
            •••• •••• •••• {last4}
          </Text>
        </View>

        {/* Card Details Footer Row */}
        <View style={styles.cardFooterRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.holderLabel}>HOLDER NAME</Text>
            <Text style={styles.holderValue} numberOfLines={1}>
              {item.accountHolderName}
            </Text>
          </View>

          {item.upiId ? (
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <Text style={styles.holderLabel}>UPI ID</Text>
              <Text style={styles.upiValue} numberOfLines={1}>
                {item.upiId}
              </Text>
            </View>
          ) : item.nickname ? (
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <Text style={styles.holderLabel}>LABEL</Text>
              <Text style={styles.holderValue} numberOfLines={1}>
                {item.nickname}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Actions Bar */}
        <View style={styles.cardBottomBar}>
          <TouchableOpacity
            style={styles.statementBtn}
            onPress={() =>
              navigation.navigate('BankDetails', { bankId: item._id, bank: item })
            }
            activeOpacity={0.8}
          >
            <Icon name="receipt-outline" size={14} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.statementBtnText}>View Statement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteCardBtn}
            onPress={() => handleDeleteBank(item)}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="trash-outline" size={14} color={colors.danger || '#FF4D67'} style={{ marginRight: 4 }} />
            <Text style={styles.deleteCardBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.navHeaderTitle}>Bank Accounts</Text>

        <TouchableOpacity
          style={styles.addNavBtn}
          onPress={openAddModal}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addNavBtnText}>Add Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      {banks && banks.length > 0 && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryBannerLeft}>
            <View style={styles.summaryIconBg}>
              <Icon name="wallet" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.summaryTitle}>
                {banks.length} Bank Account{banks.length !== 1 ? 's' : ''} Linked
              </Text>
              <Text style={styles.summarySubtitle}>
                Primary: {primaryBank?.nickname || primaryBank?.bankName || 'None'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addQuickPill}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Icon name="add" size={14} color={colors.primary} />
            <Text style={styles.addQuickPillText}>Link Bank</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen statusBarColor={colors.background} edges={['top', 'left', 'right']}>
        {renderHeader()}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching bank accounts...</Text>
          </View>
        ) : banks.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconHalo}>
              <View style={styles.emptyIconInner}>
                <Icon name="card" size={32} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No Bank Accounts Linked</Text>
            <Text style={styles.emptySubtext}>
              Link your bank accounts & UPI ID for automatic statement grouping and instant bill splitting.
            </Text>
            <TouchableOpacity style={styles.addFirstBankBtn} onPress={openAddModal} activeOpacity={0.85}>
              <LinearGradient
                colors={['#8A3FFC', '#5E1BDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtnContent}
              >
                <Icon name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBankBtnText}>Link Your First Bank</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={banks}
            keyExtractor={(item, index) => item._id || item.id || `bank-${index}`}
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
                onPress={(e) => e.stopPropagation?.()}
              >
                <View style={styles.modalSheetHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingBank ? 'Edit Bank Account' : 'Link Bank Account'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon name="close-circle" size={24} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Popular Bank Chips */}
                  {!editingBank && (
                    <View style={styles.popularSection}>
                      <Text style={styles.sectionSubLabel}>SELECT POPULAR BANK</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
                        {POPULAR_BANKS.map((b) => {
                          const isSel = bankName === b.name;
                          return (
                            <TouchableOpacity
                              key={b.code}
                              style={[styles.popularChip, isSel && styles.popularChipSelected]}
                              onPress={() => {
                                setBankName(b.name);
                                setBankCode(b.code);
                              }}
                              activeOpacity={0.75}
                            >
                              <BankLogo bankName={b.name} size={18} style={{ marginRight: 6 }} />
                              <Text style={[styles.popularChipText, isSel && styles.popularChipTextSelected]}>
                                {b.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
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
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                  />

                  <Text style={styles.inputLabel}>
                    Account Holder Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    placeholder="Full name as in bank records"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                  />

                  <Text style={styles.inputLabel}>
                    Account Number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="9 to 18 digit account number"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
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
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Nickname / Label (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g. Salary Account, Personal Savings"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                  />

                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                  ) : (
                    <TouchableOpacity style={styles.saveBtnGradient} onPress={handleSaveBank} activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#8A3FFC', '#5E1BDB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtnContent}
                      >
                        <Text style={styles.saveBtnText}>
                          {editingBank ? 'Save Changes' : 'Link Bank Account'}
                        </Text>
                      </LinearGradient>
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
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  navBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  addNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    gap: 4,
  },
  addNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summarySubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 1,
  },
  addQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 2,
  },
  addQuickPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  metallicCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryMetallicBorder: {
    borderColor: 'rgba(0, 210, 106, 0.45)',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bankLogoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankNameText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  accountTypeSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.3)',
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D26A',
  },
  setPrimaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.3)',
  },
  setPrimaryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  iconEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accNumberWrapper: {
    marginVertical: spacing.xs,
  },
  accNumberLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1,
  },
  accNumberEmbossed: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 2,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  holderLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  holderValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  upiValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  cardBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statementBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCardBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger || '#FF4D67',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(138, 63, 252, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  addFirstBankBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '80%',
  },
  gradientBtnContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFirstBankBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  modalSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
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
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  popularScroll: {
    flexDirection: 'row',
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  popularChipSelected: {
    backgroundColor: 'rgba(138, 63, 252, 0.2)',
    borderColor: colors.primary,
  },
  popularChipText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  popularChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  required: {
    color: colors.danger || '#FF4D67',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 63, 252, 0.2)',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  typeBtnTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtnGradient: {
    borderRadius: radius.lg,
    overflow: 'hidden',
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
