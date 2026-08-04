import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PaymentOptionCard from './PaymentOptionCard';
import { colors, spacing, typography, radius } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';

// ─────────────────────────────────────────────────────────────────────────────
// Verified Play Store package IDs (as of 2025-26):
// ─────────────────────────────────────────────────────────────────────────────
const PKG = {
  // Google Pay India (Tez) — verified from play.google.com/store/apps/details?id=...
  GPAY: 'com.google.android.apps.nfc.phone',
  // PhonePe
  PHONEPE: 'com.phonepe.app',
  // Paytm
  PAYTM: 'net.one97.paytm',
};

const STORE_URLS = {
  GPAY: `https://play.google.com/store/apps/details?id=${PKG.GPAY}`,
  PHONEPE: `https://play.google.com/store/apps/details?id=${PKG.PHONEPE}`,
  PAYTM: `https://play.google.com/store/apps/details?id=${PKG.PAYTM}`,
};

/**
 * Build a standard upi:// deep link.
 * DO NOT append &package=... here — package is an Android Intent extra and
 * must never appear inside a upi:// URL parameter string. It corrupts the
 * UPI parameter parsing in GPay, PhonePe, and Paytm.
 */
const buildUpiUrl = (deepLink) => deepLink;

/**
 * Build an Android Intent URI to open a specific UPI app directly.
 *
 * Why Intent URI instead of upi://&package=... ?
 * The UPI spec does not define a "package" query parameter. Appending it
 * to a upi:// URL passes it as part of the query string, which UPI apps
 * then try to parse as a UPI field — causing validation failures.
 *
 * Intent URIs let Android route the Intent directly to the target package
 * without corrupting the upi:// parameter space.
 *
 * Format:
 *   intent://<host>?<params>#Intent;scheme=upi;package=<pkg>;end
 */
const buildIntentUri = (deepLink, packageId) => {
  // deepLink is: upi://pay?pa=...&pn=...&am=...
  // We need:     intent://pay?pa=...&pn=...#Intent;scheme=upi;package=X;end
  const withoutScheme = deepLink.replace(/^upi:\/\//, '');
  return `intent://${withoutScheme}#Intent;scheme=upi;package=${packageId};end`;
};

/**
 * Open a specific UPI app using Intent URI (Android) or plain upi:// (iOS).
 * Falls back to plain upi:// → then Play Store if intent URI fails.
 */
const openUpiApp = async ({ deepLink, packageId, storeUrl, onClose, onPaymentLaunched }) => {
  if (!deepLink) return;

  // On Android, try the Intent URI first (direct app targeting, no URL corruption)
  if (Platform.OS === 'android') {
    const intentUri = buildIntentUri(deepLink, packageId);
    try {
      const canOpen = await Linking.canOpenURL(intentUri).catch(() => false);
      if (canOpen) {
        if (onPaymentLaunched) onPaymentLaunched();
        await Linking.openURL(intentUri);
        onClose();
        return;
      }
    } catch (_) { /* fall through */ }

    // Fallback 1: plain upi:// (lets system picker choose, but deepLink is clean)
    try {
      if (onPaymentLaunched) onPaymentLaunched();
      await Linking.openURL(deepLink);
      onClose();
      return;
    } catch (_) { /* fall through */ }

    // Fallback 2: open Play Store
    Linking.openURL(storeUrl).catch(() => {});
    onClose();
    return;
  }

  // iOS — UPI apps register upi:// so plain openURL works
  try {
    if (onPaymentLaunched) onPaymentLaunched();
    await Linking.openURL(deepLink);
    onClose();
  } catch (_) {
    Alert.alert('App not found', 'Please install the UPI app from the App Store.');
  }
};

const PaymentBottomSheet = ({
  visible,
  onClose,
  paymentData, // { deepLink, amount, receiver, upiId, note }
  loading = false,
  onPaymentLaunched,
}) => {
  const [appInstalledState, setAppInstalledState] = useState({
    gpay: false,
    phonepe: false,
    paytm: false,
  });
  const [checkingApps, setCheckingApps] = useState(false);

  const translateY = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      checkInstalledApps();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const checkInstalledApps = async () => {
    setCheckingApps(true);
    try {
      // On Android 11+ (targetSdk 30+) canOpenURL only works for schemes
      // declared in <queries> in AndroidManifest.xml. We have gpay://, phonepe://,
      // paytmmp://, upi:// all declared — so these checks are valid.
      const [gpay, phonepe, paytm, upi] = await Promise.all([
        Linking.canOpenURL('gpay://').catch(() => false),
        Linking.canOpenURL('phonepe://').catch(() => false),
        Linking.canOpenURL('paytmmp://').catch(() => Linking.canOpenURL('paytm://').catch(() => false)),
        Linking.canOpenURL('upi://').catch(() => false),
      ]);

      setAppInstalledState({
        // Show as "installed" if the specific scheme responds OR if generic upi:// does
        gpay: Boolean(gpay || upi),
        phonepe: Boolean(phonepe || upi),
        paytm: Boolean(paytm || upi),
      });
    } catch (err) {
      console.log('[PaymentBottomSheet] Error checking installed apps:', err);
    } finally {
      setCheckingApps(false);
    }
  };

  if (!visible) return null;

  const { deepLink, amount, receiver, upiId } = paymentData || {};

  const handleOpenGooglePay = () =>
    openUpiApp({
      deepLink: buildUpiUrl(deepLink),
      packageId: PKG.GPAY,
      storeUrl: STORE_URLS.GPAY,
      onClose,
      onPaymentLaunched,
    });

  const handleOpenPhonePe = () =>
    openUpiApp({
      deepLink: buildUpiUrl(deepLink),
      packageId: PKG.PHONEPE,
      storeUrl: STORE_URLS.PHONEPE,
      onClose,
      onPaymentLaunched,
    });

  const handleOpenPaytm = () =>
    openUpiApp({
      deepLink: buildUpiUrl(deepLink),
      packageId: PKG.PAYTM,
      storeUrl: STORE_URLS.PAYTM,
      onClose,
      onPaymentLaunched,
    });

  const handleOpenOtherUpi = async () => {
    if (!deepLink) return;
    try {
      if (onPaymentLaunched) onPaymentLaunched();
      await Linking.openURL(deepLink);
    } catch (err) {
      console.log('[PaymentBottomSheet] Error opening generic UPI link:', err);
      Alert.alert('Error', 'No UPI app found. Please install any UPI app (BHIM, GPay, PhonePe).');
    }
    onClose();
  };

  const isButtonsDisabled = loading || !deepLink;

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
                  <Text style={styles.title}>Choose Payment App</Text>
                  <Text style={styles.subtitle}>Select your preferred UPI app to pay</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Icon name="close-circle" size={24} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              {/* Payment Summary Header Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryMeta}>
                    <Text style={styles.summaryLabel}>PAYING TO</Text>
                    <Text style={styles.receiverName}>{receiver || 'Receiver'}</Text>
                    <Text style={styles.upiIdText}>{upiId || 'UPI ID'}</Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>AMOUNT</Text>
                    <Text style={styles.amountValue}>{formatCurrency(amount || 0)}</Text>
                  </View>
                </View>
              </View>

              {/* Loading Indicator */}
              {(loading || checkingApps) && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Generating secure UPI payment link...</Text>
                </View>
              )}

              {/* Options List */}
              <View style={styles.optionsList}>
                <PaymentOptionCard
                  title="Google Pay"
                  subtitle="Pay using GPay"
                  iconName="logo-google"
                  iconColor="#4285F4"
                  bgColor="#4285F415"
                  badgeText={appInstalledState.gpay ? 'Installed' : 'Play Store'}
                  onPress={handleOpenGooglePay}
                  disabled={isButtonsDisabled}
                />

                <PaymentOptionCard
                  title="PhonePe"
                  subtitle="Pay using PhonePe"
                  iconName="wallet-outline"
                  iconColor="#5f259f"
                  bgColor="#5f259f15"
                  badgeText={appInstalledState.phonepe ? 'Installed' : 'Play Store'}
                  onPress={handleOpenPhonePe}
                  disabled={isButtonsDisabled}
                />

                <PaymentOptionCard
                  title="Paytm"
                  subtitle="Pay using Paytm UPI"
                  iconName="card-outline"
                  iconColor="#00baf2"
                  bgColor="#00baf215"
                  badgeText={appInstalledState.paytm ? 'Installed' : 'Play Store'}
                  onPress={handleOpenPaytm}
                  disabled={isButtonsDisabled}
                />

                <PaymentOptionCard
                  title="Other UPI Apps"
                  subtitle="BHIM, Cred, Bank Apps & more"
                  iconName="apps-outline"
                  iconColor={colors.success}
                  bgColor={colors.success + '15'}
                  onPress={handleOpenOtherUpi}
                  disabled={isButtonsDisabled}
                />
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
    marginBottom: spacing.lg,
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
  upiIdText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.success,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  optionsList: {
    marginTop: spacing.xs,
  },
});

export default PaymentBottomSheet;
