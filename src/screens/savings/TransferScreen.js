import React, { useState, useEffect } from 'react';
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
import { formatCurrency, getCurrencySymbol } from '../../utils/formatCurrency';
import savingsApi from '../../api/savings';
import CustomAlert from '../../components/molecules/CustomAlert';

import { useQueryClient } from '@tanstack/react-query';

const TransferScreen = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const initialFromJarId = route.params?.fromJarId;

  const [jars, setJars] = useState([]);
  const [fromJarId, setFromJarId] = useState(initialFromJarId || '');
  const [toJarId, setToJarId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fetchingJars, setFetchingJars] = useState(true);
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

  useEffect(() => {
    loadJars();
  }, []);

  const loadJars = async () => {
    setFetchingJars(true);
    try {
      const res = await savingsApi.getSavingsJars('active');
      if (res && res.data) {
        const activeJars = res.data;
        setJars(activeJars);

        if (activeJars.length > 0) {
          const defaultFrom = initialFromJarId || activeJars[0]._id;
          setFromJarId(defaultFrom);

          const defaultTo = activeJars.find((j) => j._id !== defaultFrom)?._id || '';
          setToJarId(defaultTo);
        }
      }
    } catch (err) {
      console.log('[TransferScreen] Load error:', err);
    } finally {
      setFetchingJars(false);
    }
  };

  const selectedFromJar = jars.find((j) => j._id === fromJarId);
  const selectedToJar = jars.find((j) => j._id === toJarId);

  const availableBalance = selectedFromJar?.currentAmount || 0;

  const handleTransfer = async () => {
    if (!fromJarId || !toJarId) {
      showAlert('Selection Error', 'Please select both source and destination jars.', 'warning');
      return;
    }

    if (fromJarId === toJarId) {
      showAlert('Invalid Selection', 'Source and destination jars must be different.', 'warning');
      return;
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount greater than 0.', 'warning');
      return;
    }

    if (numAmount > availableBalance) {
      showAlert(
        'Insufficient Balance',
        `Source jar "${selectedFromJar?.name}" only has ${formatCurrency(availableBalance)} available.`,
        'warning'
      );
      return;
    }

    setLoading(true);
    try {
      await savingsApi.transferMoney({
        fromJarId,
        toJarId,
        amount: numAmount,
        notes: notes.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ['savingsJars'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });

      showAlert(
        'Transfer Complete 🎉',
        `Successfully transferred ${formatCurrency(numAmount)} from "${selectedFromJar?.name}" to "${selectedToJar?.name}"!`,
        'success',
        [{ text: 'Awesome' }],
        () => navigation.goBack()
      );
    } catch (err) {
      console.log('[TransferScreen] Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to complete transfer';
      showAlert('Transfer Failed', errMsg, 'destructive');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingJars) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Savings Jars...</Text>
      </SafeAreaView>
    );
  }

  if (jars.length < 2) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer Funds</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🏺</Text>
          <Text style={styles.emptyTitle}>At Least 2 Active Jars Required</Text>
          <Text style={styles.emptySub}>
            You need at least 2 active Savings Jars to transfer money between goals.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateSavingsJar')}
          >
            <Text style={styles.createBtnText}>Create Another Jar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Between Jars</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* FROM JAR SELECTOR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRANSFER FROM (SOURCE)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelectorRow}>
            {jars.map((j) => (
              <TouchableOpacity
                key={j._id}
                style={[
                  styles.jarChip,
                  fromJarId === j._id && styles.jarChipFromActive,
                  toJarId === j._id && styles.jarChipDisabled,
                ]}
                onPress={() => {
                  if (j._id === toJarId) return;
                  setFromJarId(j._id);
                }}
              >
                <Text style={styles.chipEmoji}>{j.icon || '🏆'}</Text>
                <View>
                  <Text style={styles.chipName}>{j.name}</Text>
                  <Text style={styles.chipBalance}>{formatCurrency(j.currentAmount || 0)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SWAP ICON DECORATOR */}
        <View style={styles.swapDecorator}>
          <Icon name="arrow-down" size={20} color={colors.primary} />
        </View>

        {/* TO JAR SELECTOR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRANSFER TO (DESTINATION)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelectorRow}>
            {jars.map((j) => (
              <TouchableOpacity
                key={j._id}
                style={[
                  styles.jarChip,
                  toJarId === j._id && styles.jarChipToActive,
                  fromJarId === j._id && styles.jarChipDisabled,
                ]}
                onPress={() => {
                  if (j._id === fromJarId) return;
                  setToJarId(j._id);
                }}
              >
                <Text style={styles.chipEmoji}>{j.icon || '🏆'}</Text>
                <View>
                  <Text style={styles.chipName}>{j.name}</Text>
                  <Text style={styles.chipBalance}>{formatCurrency(j.currentAmount || 0)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AMOUNT INPUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRANSFER AMOUNT *</Text>
          <View style={styles.amountInputCard}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Reallocating budget for vacation"
              placeholderTextColor={colors.text.muted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleTransfer}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Confirm Transfer</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
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
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  jarSelectorRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  jarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.xs,
    gap: spacing.xs,
  },
  jarChipFromActive: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '10',
  },
  jarChipToActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  jarChipDisabled: {
    opacity: 0.35,
  },
  chipEmoji: {
    fontSize: 22,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  chipBalance: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  swapDecorator: {
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xs,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
  },
  createBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full || 20,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TransferScreen;
