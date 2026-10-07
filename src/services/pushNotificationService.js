/**
 * Push Notification Service (FCM)
 * --------------------------------
 * Handles Firebase Cloud Messaging token management,
 * foreground notification display, and permission requests.
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../api/client';
import { navigationRef } from '../navigation/AppNavigator';
import { resolveNotificationRoute } from '../utils/notificationRouter';

const CHANNEL_ID = 'expense-tracker-v2';

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

    // Request Notifee & Firebase messaging permissions
    try {
      await notifee.requestPermission();
    } catch {}

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
    try {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Expenso Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
      });
      console.log('[FCM] Ensured high importance notification channel:', CHANNEL_ID);
    } catch (err) {
      console.warn('[FCM] Channel configuration warning:', err?.message);
    }
  }
};

/**
 * Helper to navigate to target screen or Notifications when notification is clicked
 */
const navigateToNotificationTarget = (payload = {}, attempts = 0) => {
  if (navigationRef.isReady()) {
    console.log('[FCM] Navigation container ready — navigating with payload:', JSON.stringify(payload));
    try {
      const target = resolveNotificationRoute(payload);
      if (target?.params) {
        navigationRef.navigate(target.screen, target.params);
      } else if (target?.screen) {
        navigationRef.navigate(target.screen);
      } else {
        navigationRef.navigate('Notifications');
      }
    } catch (navErr) {
      console.error('[FCM] Navigation error:', navErr?.message);
      try {
        navigationRef.navigate('Notifications');
      } catch {}
    }
  } else if (attempts < 30) {
    setTimeout(() => navigateToNotificationTarget(payload, attempts + 1), 100);
  }
};

/**
 * Display a local notification using Notifee with heads-up popup banner
 */
export const displayLocalNotification = async (title, body, data = {}) => {
  try {
    await ensureNotificationChannel();

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibrationPattern: [300, 500],
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        lightUpScreen: true,
      },
      data,
    });
  } catch (err) {
    console.error('[FCM] Display notification error:', err?.message || err);
  }
};

let foregroundUnsubscribe = null;
let clickListenersInitialized = false;
let tokenRefreshUnsubscribe = null;

/**
 * Setup foreground message handler
 * When app is OPEN, FCM messages arrive silently — we show them via Notifee
 */
export const setupForegroundHandler = () => {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }

  foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('[FCM] Foreground message received:', remoteMessage?.notification?.title);

    const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
    const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
    const data = remoteMessage?.data || {};

    await displayLocalNotification(title, body, data);
  });

  return foregroundUnsubscribe;
};

/**
 * Setup notification click/press handler
 * Opens app and navigates to Notifications screen when notification is tapped
 */
export const setupNotificationClickListener = () => {
  if (clickListenersInitialized) return;
  clickListenersInitialized = true;

  // 1. Notifee foreground/background notification tap handler
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('[FCM] Notification tapped (foreground/background event):', detail?.notification?.title);
      navigateToNotificationTarget(detail?.notification?.data || {});
    }
  });

  // 2. Check if app was opened from a killed state by tapping a Notifee notification
  notifee.getInitialNotification().then((initialNotification) => {
    if (initialNotification) {
      console.log('[FCM] App opened from killed state via Notifee:', initialNotification?.notification?.title);
      navigateToNotificationTarget(initialNotification?.notification?.data || {});
    }
  });

  // 3. FCM native notification open handlers
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('[FCM] App opened from background via FCM:', remoteMessage?.notification?.title);
    navigateToNotificationTarget(remoteMessage?.data || {});
  });

  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('[FCM] App opened from killed state via FCM:', remoteMessage?.notification?.title);
      navigateToNotificationTarget(remoteMessage?.data || {});
    }
  });
};

/**
 * Setup token refresh handler
 * FCM token can change — re-register with backend when it does
 */
export const setupTokenRefreshHandler = () => {
  if (tokenRefreshUnsubscribe) {
    tokenRefreshUnsubscribe();
    tokenRefreshUnsubscribe = null;
  }
  tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('[FCM] Token refreshed:', newToken?.substring(0, 30) + '...');
    await registerFcmTokenWithBackend(newToken);
  });
  return tokenRefreshUnsubscribe;
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
