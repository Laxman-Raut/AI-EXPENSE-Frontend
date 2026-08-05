import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';
import CustomAlert from '../../components/molecules/CustomAlert';

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const DepositScreen = ({ route, navigation }) => {
  const { jar } = route.params;

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    onPress: null,
  });

  const showAlert = (title, message, type = 'info', buttons = [], onPress = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons: buttons.length ? buttons : [{ text: 'OK' }],
      onPress,
    });
  };

  const handleQuickAdd = (addVal) => {
    const currentVal = Number(amount) || 0;
    setAmount(String(currentVal + addVal));
  };

  const handleDeposit = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount greater than 0.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await savingsApi.depositToJar(jar._id, {
        amount: numAmount,
        notes: notes.trim() || 'Deposit into jar',
      });

      showAlert(
        'Money Deposited! 💰',
        `₹${numAmount} successfully added to your "${jar.name}" savings jar.`,
        'success',
        [{ text: 'Awesome' }],
        () => navigation.goBack()
      );
    } catch (err) {
      console.log('[DepositScreen] Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to complete deposit';
      showAlert('Deposit Failed', errMsg, 'destructive');
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
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Target Jar Banner */}
        <View style={styles.jarBanner}>
          <View style={[styles.iconBox, { backgroundColor: (jar.color || '#4C6EF5') + '25' }]}>
            <Text style={styles.iconEmoji}>{jar.icon || '🏆'}</Text>
          </View>
          <View style={styles.jarBannerMeta}>
            <Text style={styles.jarBannerSub}>SAVING FOR</Text>
            <Text style={styles.jarBannerName}>{jar.name}</Text>
            <Text style={styles.jarBannerBalance}>
              Current Balance:{' '}
              <Text style={{ color: colors.success, fontWeight: '700' }}>
                {formatCurrency(jar.currentAmount || 0)}
              </Text>
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEPOSIT AMOUNT *</Text>
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

          {/* Quick Add Chips */}
          <View style={styles.quickChipsRow}>
            {QUICK_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickChip}
                onPress={() => handleQuickAdd(val)}
              >
                <Text style={styles.quickChipText}>+₹{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Monthly salary savings, Gift bonus"
              placeholderTextColor={colors.text.muted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleDeposit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Confirm Deposit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Premium Themed Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onButtonPress={(btn) => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onPress) {
            alertConfig.onPress(btn);
          }
        }}
        onCancel={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onPress) {
            alertConfig.onPress({ style: 'cancel' });
          }
        }}
      />
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
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
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  quickChip: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.success,
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

export default DepositScreen;
