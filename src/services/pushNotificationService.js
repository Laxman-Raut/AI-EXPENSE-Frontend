/**
 * Push Notification Service (FCM)
 * --------------------------------
 * Handles Firebase Cloud Messaging token management,
 * foreground notification display, and permission requests.
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../api/client';
import { navigationRef } from '../navigation/AppNavigator';

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
 * Helper to navigate to Notifications screen when notification is clicked
 */
const navigateToNotificationsScreen = (attempts = 0) => {
  if (navigationRef.isReady()) {
    console.log('[FCM] Navigation container ready — navigating to Notifications screen');
    try {
      navigationRef.navigate('Today', {
        screen: 'Notifications',
        initial: false,
      });
    } catch (navErr) {
      console.error('[FCM] Navigation error:', navErr?.message);
    }
  } else if (attempts < 30) {
    setTimeout(() => navigateToNotificationsScreen(attempts + 1), 100);
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
          launchActivity: 'default',
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
 * Setup notification click/press handler
 * Opens app and navigates to Notifications screen when notification is tapped
 */
export const setupNotificationClickListener = () => {
  // 1. Notifee foreground/background notification tap handler
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('[FCM] Notification tapped (foreground/background event):', detail?.notification?.title);
      navigateToNotificationsScreen();
    }
  });

  // 2. Check if app was opened from a killed state by tapping a Notifee notification
  notifee.getInitialNotification().then((initialNotification) => {
    if (initialNotification) {
      console.log('[FCM] App opened from killed state via Notifee:', initialNotification?.notification?.title);
      navigateToNotificationsScreen();
    }
  });

  // 3. FCM native notification open handlers
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM] App opened from background via FCM:', remoteMessage?.notification?.title);
    navigateToNotificationsScreen();
  });

  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('[FCM] App opened from killed state via FCM:', remoteMessage?.notification?.title);
      navigateToNotificationsScreen();
    }
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

    // 5. Setup notification click listener
    setupNotificationClickListener();

    // 6. Setup token refresh handler
    setupTokenRefreshHandler();

    console.log('[FCM] ✅ Push notifications initialized successfully.');
  } catch (err) {
    console.error('[FCM] Initialization error:', err);
  }
};
