import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../../components/templates/Screen';
import CustomAlert from '../../components/molecules/CustomAlert';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useTransaction, useDeleteTransaction } from '../../hooks/useTransactions';
import { formatCurrency, getGlobalCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/formatDate';
import BankLogo from '../../components/atoms/BankLogo';

const getCategoryIconInfo = (cat = '', type = 'expense') => {
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('dining')) return { icon: 'fast-food', color: '#FF9500' };
  if (c.includes('shop') || c.includes('grocer')) return { icon: 'bag-handle', color: '#FF2D55' };
  if (c.includes('travel') || c.includes('flight') || c.includes('cab')) return { icon: 'airplane', color: '#5856D6' };
  if (c.includes('bill') || c.includes('recharge') || c.includes('utility')) return { icon: 'receipt', color: '#34C759' };
  if (c.includes('salary') || c.includes('income')) return { icon: 'cash', color: '#00D26A' };
  if (c.includes('invest') || c.includes('stock')) return { icon: 'trending-up', color: '#AF52DE' };
  if (c.includes('health') || c.includes('med')) return { icon: 'heart-pulse', color: '#FF3B30' };
  if (c.includes('entertain') || c.includes('movie')) return { icon: 'game-controller', color: '#5AC8FA' };
  if (c.includes('edu')) return { icon: 'school', color: '#007AFF' };

  return {
    icon: type === 'income' ? 'arrow-down-circle' : 'card',
    color: type === 'income' ? colors.success : colors.primary,
  };
};

const TransactionDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { id } = route.params;
  const { data: transaction, isLoading } = useTransaction(id);
  const deleteMutation = useDeleteTransaction();
  const targetCurrency = user?.currency || getGlobalCurrency();

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleShare = async () => {
    if (!transaction) return;
    const isInc = transaction.type === 'income';
    const amountStr = `${isInc ? '+' : '-'}${formatCurrency(transaction.amount, transaction.currency || 'INR', targetCurrency)}`;
    const text = `💸 ExpenseAI Transaction Details:\n• Type: ${transaction.type.toUpperCase()}\n• Amount: ${amountStr}\n• Category: ${transaction.category}\n• Date: ${formatDateTime(transaction.transactionDate)}\n• Notes: ${transaction.note || transaction.description}`;
    try {
      await Share.share({ message: text });
    } catch {
      // Ignored
    }
  };

  if (isLoading || !transaction) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Fetching transaction details...</Text>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const themeColor = isIncome ? colors.success || '#00D26A' : colors.danger || '#FF4D67';
  const categoryMeta = getCategoryIconInfo(transaction.category, transaction.type);

  // Bank Info resolution
  let bankName = null;
  let bankAccNo = null;
  if (transaction.bankAccount) {
    if (typeof transaction.bankAccount === 'object') {
      bankName = transaction.bankAccount.bankName || transaction.bankAccount.nickname;
      bankAccNo = transaction.bankAccount.accountNumber;
    } else {
      bankName = 'Linked Bank Account';
    }
  }

  const renderHeader = () => (
    <View style={styles.topNavRow}>
      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.navTitle}>Transaction Details</Text>

      <View style={styles.rightNavGroup}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Icon name="share-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.editNavBtn]}
          onPress={() => navigation.navigate('AddTransaction', { id: transaction._id })}
          activeOpacity={0.7}
        >
          <Icon name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen statusBarColor={colors.background} edges={['top', 'left', 'right']}>
        {renderHeader()}

        <CustomAlert
          visible={deleteAlertVisible}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          type="destructive"
          buttons={[
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive' },
          ]}
          onButtonPress={async (btn) => {
            setDeleteAlertVisible(false);
            if (btn.style === 'destructive') {
              try {
                await deleteMutation.mutateAsync(id);
                navigation.goBack();
              } catch (error) {
                setErrorMessage(error.message || 'Failed to delete transaction');
                setErrorAlertVisible(true);
              }
            }
          }}
          onCancel={() => setDeleteAlertVisible(false)}
        />

        <CustomAlert
          visible={errorAlertVisible}
          title="Error"
          message={errorMessage}
          type="destructive"
          buttons={[{ text: 'OK' }]}
          onButtonPress={() => setErrorAlertVisible(false)}
          onCancel={() => setErrorAlertVisible(false)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Premium Glassmorphic Card */}
          <LinearGradient
            colors={
              isIncome
                ? ['#142823', '#0B1714', '#060E0C']
                : ['#2E161C', '#1A0B0E', '#0F0608']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              { borderColor: isIncome ? 'rgba(0, 210, 106, 0.35)' : 'rgba(255, 77, 103, 0.35)' },
            ]}
          >
            {/* Category Halo Badge */}
            <View style={[styles.haloCircle, { backgroundColor: isIncome ? 'rgba(0, 210, 106, 0.15)' : 'rgba(255, 77, 103, 0.15)' }]}>
              <View style={[styles.haloInner, { backgroundColor: categoryMeta.color }]}>
                <Icon name={categoryMeta.icon} size={28} color="#FFFFFF" />
              </View>
            </View>

            {/* Type Chip */}
            <View style={[styles.typeBadge, { backgroundColor: isIncome ? 'rgba(0, 210, 106, 0.18)' : 'rgba(255, 77, 103, 0.18)' }]}>
              <Icon
                name={isIncome ? 'arrow-down-left-sharp' : 'arrow-up-right-sharp'}
                size={14}
                color={themeColor}
              />
              <Text style={[styles.typeBadgeText, { color: themeColor }]}>
                {transaction.type.toUpperCase()}
              </Text>
            </View>

            {/* Amount */}
            <Text style={[styles.amountDisplay, { color: themeColor }]}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency || 'INR', targetCurrency)}
            </Text>

            {/* Description */}
            <Text style={styles.heroTitle} numberOfLines={2}>
              {transaction.description || transaction.category}
            </Text>
          </LinearGradient>

          {/* Details Breakdown Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionHeaderTitle}>TRANSACTION DETAILS</Text>

            {/* Category Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaIconBg}>
                <Icon name={categoryMeta.icon} size={18} color={categoryMeta.color} />
              </View>
              <View style={styles.metaTextGroup}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{transaction.category}</Text>
              </View>
            </View>

            {/* Payment Method Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaIconBg}>
                <Icon name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.metaTextGroup}>
                <Text style={styles.metaLabel}>Payment Method</Text>
                <Text style={styles.metaValue}>{transaction.paymentMethod || 'UPI'}</Text>
              </View>
            </View>

            {/* Bank Account Row (If present) */}
            {bankName && (
              <View style={styles.metaRow}>
                <View style={styles.metaIconBg}>
                  <BankLogo bankName={bankName} size={24} />
                </View>
                <View style={styles.metaTextGroup}>
                  <Text style={styles.metaLabel}>Bank Account</Text>
                  <Text style={styles.metaValue}>
                    {bankName} {bankAccNo ? `(••${String(bankAccNo).slice(-4)})` : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Date & Time Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaIconBg}>
                <Icon name="calendar-outline" size={18} color="#FF9500" />
              </View>
              <View style={styles.metaTextGroup}>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>{formatDateTime(transaction.transactionDate || transaction.createdAt)}</Text>
              </View>
            </View>

            {/* Notes Callout Box */}
            {transaction.note || transaction.description ? (
              <View style={styles.notesBox}>
                <View style={styles.notesHeader}>
                  <Icon name="document-text-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.notesLabel}>Notes & Remarks</Text>
                </View>
                <Text style={styles.notesBody}>
                  {transaction.note || transaction.description}
                </Text>
              </View>
            ) : null}

            {/* Reference ID Footer */}
            <View style={styles.referenceFooter}>
              <Text style={styles.referenceLabel}>REF ID:</Text>
              <Text style={styles.referenceVal}>{transaction._id}</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.editBtnPrimary}
              onPress={() => navigation.navigate('AddTransaction', { id: transaction._id })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#8A3FFC', '#5E1BDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtnContent}
              >
                <Icon name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>Edit Details</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtnDanger}
              onPress={() => setDeleteAlertVisible(true)}
              activeOpacity={0.85}
            >
              <Icon name="trash-outline" size={18} color={colors.danger || '#FF4D67'} style={{ marginRight: 6 }} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editNavBtn: {
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
  },
  navTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  haloCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  haloInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountDisplay: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  metaIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  metaTextGroup: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  notesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  notesBody: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  referenceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  referenceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
  },
  referenceVal: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  editBtnPrimary: {
    flex: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradientBtnContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtnDanger: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 77, 103, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 103, 0.3)',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger || '#FF4D67',
  },
});

export default TransactionDetailScreen;
