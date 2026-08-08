import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';

const PaymentBottomSheet = ({
  visible,
  onClose,
  paymentData, // { amount, receiver, upiId, note }
  loading = false,
  onMarkPaid,
}) => {
  const [copied, setCopied] = useState(false);
  const translateY = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setCopied(false);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const { amount, receiver, upiId } = paymentData || {};

  const handleCopyUpi = () => {
    if (!upiId) return;
    Clipboard.setString(upiId);
    setCopied(true);
    
    if (Platform.OS === 'android') {
      ToastAndroid.show('UPI ID Copied to Clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'UPI ID copied to clipboard!');
    }

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleConfirmPaid = () => {
    if (onMarkPaid) {
      onMarkPaid();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={[styles.sheetContent, { transform: [{ translateY }] }]}>
              {/* Drag Handle Header */}
              <View style={styles.handleBar} />

              {/* Title & Close */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Settle Split Expense</Text>
                  <Text style={styles.subtitle}>Copy UPI ID and complete the payment manually</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Icon name="close-circle" size={24} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              {/* Payment Summary Box */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryMeta}>
                    <Text style={styles.summaryLabel}>PAY TO</Text>
                    <Text style={styles.receiverName}>{receiver || 'Receiver'}</Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>AMOUNT</Text>
                    <Text style={styles.amountValue}>{formatCurrency(amount || 0)}</Text>
                  </View>
                </View>
              </View>

              {/* UPI Copy Card */}
              <View style={styles.upiCard}>
                <View style={styles.upiDetails}>
                  <Text style={styles.upiLabel}>RECEIVER'S UPI ID</Text>
                  <Text style={styles.upiIdText}>{upiId || 'No UPI ID available'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyButton, copied && styles.copyButtonActive]}
                  onPress={handleCopyUpi}
                  activeOpacity={0.7}
                  disabled={!upiId}
                >
                  <Icon 
                    name={copied ? 'checkmark-circle' : 'copy-outline'} 
                    size={16} 
                    color={copied ? '#fff' : colors.primary} 
                  />
                  <Text style={[styles.copyButtonText, copied && styles.copyButtonTextActive]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>How to Pay:</Text>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Tap the <Text style={{fontWeight: '700', color: colors.primary}}>Copy</Text> button to copy the UPI ID.</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Open any UPI payment app (GPay, PhonePe, Paytm, BHIM, etc.).</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>Send exactly <Text style={{fontWeight: '700', color: colors.success}}>{formatCurrency(amount || 0)}</Text> to the copied UPI ID.</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>Return to Expenso and tap the <Text style={{fontWeight: '700', color: '#fff'}}>I Have Paid</Text> button below to notify the creator.</Text>
                </View>
              </View>

              {/* Loading Indicator */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Updating payment status...</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnCancel]} 
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.btnPay]} 
                  onPress={handleConfirmPaid}
                  disabled={loading || !upiId}
                >
                  <Text style={styles.btnPayText}>I Have Paid</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes?.xs || 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMeta: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.success,
    marginTop: 2,
  },
  upiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md || 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upiDetails: {
    flex: 1,
  },
  upiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  upiIdText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  copyButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  copyButtonTextActive: {
    color: '#fff',
  },
  instructionsContainer: {
    backgroundColor: colors.surface + '80',
    borderRadius: radius.md || 10,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.divider,
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  btnPay: {
    backgroundColor: colors.primary,
  },
  btnPayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});

export default PaymentBottomSheet;
