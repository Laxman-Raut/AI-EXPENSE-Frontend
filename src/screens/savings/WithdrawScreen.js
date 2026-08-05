import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';

const WithdrawScreen = ({ route, navigation }) => {
  const { jar } = route.params;

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const availableBalance = jar.currentAmount || 0;

  const handleSetMax = () => {
    setAmount(String(availableBalance));
  };

  const handleWithdraw = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (numAmount > availableBalance) {
      Alert.alert(
        'Insufficient Funds',
        `You cannot withdraw more than your available balance (${formatCurrency(availableBalance)}).`
      );
      return;
    }

    setLoading(true);
    try {
      await savingsApi.withdrawFromJar(jar._id, {
        amount: numAmount,
        notes: notes.trim() || 'Withdrawal from jar',
      });

      Alert.alert('Success', `Withdrew ₹${numAmount} from ${jar.name}`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.log('[WithdrawScreen] Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to complete withdrawal';
      Alert.alert('Withdrawal Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Money</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Source Jar Banner */}
        <View style={styles.jarBanner}>
          <View style={[styles.iconBox, { backgroundColor: (jar.color || '#4C6EF5') + '25' }]}>
            <Text style={styles.iconEmoji}>{jar.icon || '🏆'}</Text>
          </View>
          <View style={styles.jarBannerMeta}>
            <Text style={styles.jarBannerSub}>WITHDRAWING FROM</Text>
            <Text style={styles.jarBannerName}>{jar.name}</Text>
            <Text style={styles.jarBannerBalance}>
              Available Balance: <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatCurrency(availableBalance)}</Text>
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>WITHDRAWAL AMOUNT *</Text>
            <TouchableOpacity onPress={handleSetMax}>
              <Text style={styles.maxBtnText}>Withdraw All ({formatCurrency(availableBalance)})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountInputCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REASON / NOTES (OPTIONAL)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Emergency medical expense, Bill payment"
              placeholderTextColor={colors.text.muted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleWithdraw}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Confirm Withdrawal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  jarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconEmoji: {
    fontSize: 24,
  },
  jarBannerMeta: {
    flex: 1,
  },
  jarBannerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  jarBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 1,
  },
  jarBannerBalance: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  maxBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  amountInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
  },
  inputBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: colors.text.primary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.full || 24,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default WithdrawScreen;
