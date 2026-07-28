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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PaymentOptionCard from './PaymentOptionCard';
import { colors, spacing, typography, radius } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';

const PaymentBottomSheet = ({
  visible,
  onClose,
  paymentData, // { deepLink, amount, receiver, upiId, note }
  loading = false,
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
      const [gpay, phonepe, paytm, upi] = await Promise.all([
        Linking.canOpenURL('gpay://').catch(() => false),
        Linking.canOpenURL('phonepe://').catch(() => false),
        Linking.canOpenURL('paytmmp://').catch(() => Linking.canOpenURL('paytm://').catch(() => false)),
        Linking.canOpenURL('upi://').catch(() => false),
      ]);

      setAppInstalledState({
        gpay: gpay || upi,
        phonepe: phonepe || upi,
        paytm: paytm || upi,
      });
    } catch (err) {
      console.log('[PaymentBottomSheet] Error checking installed apps:', err);
    } finally {
      setCheckingApps(false);
    }
  };

  if (!visible) return null;

  const { deepLink, amount, receiver, upiId } = paymentData || {};

  const handleOpenGooglePay = async () => {
    if (!deepLink) return;
    try {
      const gpayPkgUrl = deepLink.includes('?')
        ? `${deepLink}&package=com.google.android.apps.nsetup`
        : deepLink;

      const canOpen = await Linking.canOpenURL(gpayPkgUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(gpayPkgUrl);
        onClose();
        return;
      }

      const canOpenUpi = await Linking.canOpenURL(deepLink).catch(() => false);
      if (canOpenUpi) {
        await Linking.openURL(deepLink);
        onClose();
        return;
      }

      await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.nsetup');
    } catch (err) {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.nsetup').catch(() => {});
    }
    onClose();
  };

  const handleOpenPhonePe = async () => {
    if (!deepLink) return;
    try {
      const phonepePkgUrl = deepLink.includes('?')
        ? `${deepLink}&package=com.phonepe.app`
        : deepLink;

      const canOpen = await Linking.canOpenURL(phonepePkgUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(phonepePkgUrl);
        onClose();
        return;
      }

      const canOpenUpi = await Linking.canOpenURL(deepLink).catch(() => false);
      if (canOpenUpi) {
        await Linking.openURL(deepLink);
        onClose();
        return;
      }

      await Linking.openURL('https://play.google.com/store/apps/details?id=com.phonepe.app');
    } catch (err) {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.phonepe.app').catch(() => {});
    }
    onClose();
  };

  const handleOpenPaytm = async () => {
    if (!deepLink) return;
    try {
      const paytmPkgUrl = deepLink.includes('?')
        ? `${deepLink}&package=net.one97.paytm`
        : deepLink;

      const canOpen = await Linking.canOpenURL(paytmPkgUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(paytmPkgUrl);
        onClose();
        return;
      }

      const canOpenUpi = await Linking.canOpenURL(deepLink).catch(() => false);
      if (canOpenUpi) {
        await Linking.openURL(deepLink);
        onClose();
        return;
      }

      await Linking.openURL('https://play.google.com/store/apps/details?id=net.one97.paytm');
    } catch (err) {
      Linking.openURL('https://play.google.com/store/apps/details?id=net.one97.paytm').catch(() => {});
    }
    onClose();
  };

  const handleOpenOtherUpi = async () => {
    if (!deepLink) return;
    try {
      await Linking.openURL(deepLink);
    } catch (err) {
      console.log('[PaymentBottomSheet] Error opening generic UPI link:', err);
    }
    onClose();
  };

  const isButtonsDisabled = loading || checkingApps || !deepLink;

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
