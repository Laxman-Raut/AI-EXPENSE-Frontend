/**
 * Push Notification Service (FCM)
 * --------------------------------
 * Handles Firebase Cloud Messaging token management,
 * foreground notification display, and permission requests.
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../api/client';

const CHANNEL_ID = 'expense-tracker';

/**
 * Request notification permission (Android 13+ requires explicit permission)
 */
export const requestNotificationPermission = async () => {
  try {
    // Android 13+ (API 33) requires POST_NOTIFICATIONS runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[FCM] Notification permission denied by user.');
        return false;
      }
    }

    // Request Firebase messaging permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log(`[FCM] Authorization status: ${authStatus}, enabled: ${enabled}`);
    return enabled;
  } catch (err) {
    console.error('[FCM] Permission request error:', err);
    return false;
  }
};

/**
 * Get the device FCM token
 */
export const getFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log(`[FCM] Device token: ${token?.substring(0, 30)}...`);
    return token;
  } catch (err) {
    console.error('[FCM] Get token error:', err);
    return null;
  }
};

/**
 * Register FCM token with backend
 */
export const registerFcmTokenWithBackend = async (fcmToken) => {
  try {
    await apiClient.put('/auth/fcm-token', { fcmToken });
    console.log('[FCM] Token registered with backend successfully.');
  } catch (err) {
    console.error('[FCM] Backend token registration failed:', err?.message);
  }
};

/**
 * Clear FCM token from backend (on logout)
 */
export const clearFcmTokenFromBackend = async () => {
  try {
    await apiClient.delete('/auth/fcm-token');
    console.log('[FCM] Token cleared from backend.');
  } catch (err) {
    console.error('[FCM] Backend token clear failed:', err?.message);
  }
};

/**
 * Ensure notification channel exists (Android)
 */
export const ensureNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Expense Tracker',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  }
};

/**
 * Display a local notification using Notifee
 */
export const displayLocalNotification = async (title, body, data = {}) => {
  try {
    await ensureNotificationChannel();

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        pressAction: {
          id: 'default',
        },
        importance: AndroidImportance.HIGH,
      },
      data,
    });
  } catch (err) {
    console.error('[FCM] Display notification error:', err?.message || err);
  }
};

/**
 * Setup foreground message handler
 * When app is OPEN, FCM messages arrive silently — we show them via Notifee
 */
export const setupForegroundHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM] Foreground message received:', remoteMessage?.notification?.title);

    const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
    const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
    const data = remoteMessage?.data || {};

    await displayLocalNotification(title, body, data);
  });
};

/**
 * Setup token refresh handler
 * FCM token can change — re-register with backend when it does
 */
export const setupTokenRefreshHandler = () => {
  return messaging().onTokenRefresh(async (newToken) => {
    console.log('[FCM] Token refreshed:', newToken?.substring(0, 30) + '...');
    await registerFcmTokenWithBackend(newToken);
  });
};

/**
 * Master initialization function
 * Call this after user is authenticated
 */
export const initializePushNotifications = async () => {
  try {
    console.log('[FCM] Initializing push notifications...');

    // 1. Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[FCM] No permission — skipping FCM setup.');
      return;
    }

    // 2. Ensure notification channel exists
    await ensureNotificationChannel();

    // 3. Get FCM token and register with backend
    const token = await getFcmToken();
    if (token) {
      await registerFcmTokenWithBackend(token);
    }

    // 4. Setup foreground handler
    setupForegroundHandler();

    // 5. Setup token refresh handler
    setupTokenRefreshHandler();

    console.log('[FCM] ✅ Push notifications initialized successfully.');
  } catch (err) {
    console.error('[FCM] Initialization error:', err);
  }
};
