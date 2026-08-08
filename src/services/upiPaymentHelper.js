import { NativeModules, Platform, Linking, ToastAndroid, Alert } from 'react-native';

const { UpiPaymentModule } = NativeModules;

// Package names for Android
export const UPI_PACKAGES = {
  GPAY: 'com.google.android.apps.nbu.paisa.user', // Google Pay India (Tez)
  PHONEPE: 'com.phonepe.app',
  PAYTM: 'net.one97.paytm',
};

// URL schemes for iOS
export const UPI_SCHEMES = {
  GPAY: 'gpay://upi/pay',
  PHONEPE: 'phonepe://upi/pay',
  PAYTM: 'paytmmp://upi/pay',
};

// Play Store / App Store URLs for fallback
export const STORE_URLS = {
  GPAY: Platform.select({
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
    ios: 'https://apps.apple.com/in/app/google-pay-save-and-pay/id1193350411',
  }),
  PHONEPE: Platform.select({
    android: 'https://play.google.com/store/apps/details?id=com.phonepe.app',
    ios: 'https://apps.apple.com/in/app/phonepe-india-s-payments-app/id1140997184',
  }),
  PAYTM: Platform.select({
    android: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
    ios: 'https://apps.apple.com/in/app/paytm-secure-upi-payments/id473941224',
  }),
};

/**
 * Format amount dynamically so it always ends with two decimal places (NPCI compliance).
 * E.g., if input is 500, 500.0, or "500", it must be formatted to "500.00".
 */
export const formatUpiAmount = (amount) => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return '0.00';
  return parsed.toFixed(2);
};

/**
 * Construct the NPCI Compliant UPI URI
 * upi://pay?pa={upi}&pn={name}&am={formatted_amount}&cu=INR&mc=0000&mode=02
 */
export const buildUpiUri = (receiverUpiId, receiverName, amount) => {
  const formattedAmount = formatUpiAmount(amount);
  const encodedName = encodeURIComponent(receiverName);
  // Strictly including cu=INR, mc=0000, and mode=02 to bypass fraud flags
  return `upi://pay?pa=${receiverUpiId}&pn=${encodedName}&am=${formattedAmount}&cu=INR&mc=0000&mode=02`;
};

/**
 * Checks if a specific UPI app is installed.
 * Uses Native Module on Android for 100% accuracy, and Linking.canOpenURL on iOS.
 */
export const checkAppInstalled = async (appName) => {
  if (Platform.OS === 'android') {
    if (!UpiPaymentModule) {
      console.warn('UpiPaymentModule is not linked/registered on Android. Falling back.');
      const scheme = appName === 'GPAY' ? 'gpay://' : appName === 'PHONEPE' ? 'phonepe://' : 'paytmmp://';
      try {
        return await Linking.canOpenURL(scheme);
      } catch {
        return false;
      }
    }
    const packageId = UPI_PACKAGES[appName];
    return await UpiPaymentModule.isAppInstalled(packageId);
  } else {
    // iOS check using URL schemes
    const scheme = appName === 'GPAY' ? 'gpay://' : appName === 'PHONEPE' ? 'phonepe://' : 'paytmmp://';
    try {
      return await Linking.canOpenURL(scheme);
    } catch {
      return false;
    }
  }
};

/**
 * Launches the UPI payment flow directly into the targeted app (bypassing the OS chooser).
 */
export const payWithUpiApp = async ({ receiverUpiId, receiverName, amount, appName }) => {
  const upiUri = buildUpiUri(receiverUpiId, receiverName, amount);
  const isInstalled = await checkAppInstalled(appName);
  const appFriendlyName = appName === 'GPAY' ? 'Google Pay' : appName === 'PHONEPE' ? 'PhonePe' : 'Paytm';

  if (!isInstalled) {
    const storeUrl = STORE_URLS[appName];
    const msg = `${appFriendlyName} is not installed on your device. Opening App Store...`;
    
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.LONG);
    } else {
      Alert.alert('App Not Installed', msg);
    }

    if (storeUrl) {
      await Linking.openURL(storeUrl);
    }
    return false;
  }

  if (Platform.OS === 'android') {
    if (UpiPaymentModule) {
      const packageId = UPI_PACKAGES[appName];
      return await UpiPaymentModule.launchUpiPayment(upiUri, packageId);
    } else {
      // Fallback intent URI using Linking
      const withoutScheme = upiUri.replace(/^upi:\/\//, '');
      const packageId = UPI_PACKAGES[appName];
      const intentUri = `intent://${withoutScheme}#Intent;scheme=upi;package=${packageId};end`;
      await Linking.openURL(intentUri);
      return true;
    }
  } else {
    // iOS direct scheme launching
    // iOS schemes generally map to: gpay://upi/pay?pa=... or phonepe://upi/pay?pa=...
    const baseScheme = UPI_SCHEMES[appName];
    const schemeUrl = upiUri.replace(/^upi:\/\/pay/, baseScheme);
    await Linking.openURL(schemeUrl);
    return true;
  }
};

/**
 * Launches the generic UPI chooser for other apps
 */
export const payWithGenericUpi = async ({ receiverUpiId, receiverName, amount }) => {
  const upiUri = buildUpiUri(receiverUpiId, receiverName, amount);

  if (Platform.OS === 'android' && UpiPaymentModule) {
    return await UpiPaymentModule.launchGenericUpi(upiUri);
  } else {
    await Linking.openURL(upiUri);
    return true;
  }
};
