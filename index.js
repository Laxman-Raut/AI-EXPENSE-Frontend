/**
 * @format
 */

import 'react-native-gesture-handler';
import './src/theme/ThemeManager';
import { AppRegistry } from 'react-native';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const NOTIFICATION_CHANNEL_ID = 'expense-tracker-v2';
const APP_ALERT_CHANNEL_ID = 'expense-tracker-app-alerts';

// ─────────────────────────────────────────────────────────────
// FCM Background Message Handler
// This runs when the app is KILLED or in BACKGROUND.
// Displays the push notification on the status bar and lockscreen via Notifee.
// ─────────────────────────────────────────────────────────────
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'ExpenseAI';
  const body =
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    '';

  console.log('[FCM Background] Message received:', title);

  // Fixed app alerts use data-only FCM so Notifee can reliably show heads-up banners.
  // Admin campaigns retain their existing native FCM notification delivery.
  if (!remoteMessage?.notification && (title || body)) {
    try {
      const isAdminNotification =
        remoteMessage?.data?.sentByAdmin === 'true' ||
        remoteMessage?.data?.sentByAdmin === true;
      const channelId = isAdminNotification ? NOTIFICATION_CHANNEL_ID : APP_ALERT_CHANNEL_ID;

      await notifee.createChannel({
        id: channelId,
        name: isAdminNotification ? 'Expenso Notifications' : 'Budget and Group Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
        lights: true,
      });

      // Display notification on status bar / lockscreen
      await notifee.displayNotification({
        id: remoteMessage?.messageId || Date.now().toString(),
        title,
        body,
        android: {
          channelId,
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
        data: remoteMessage?.data || {},
      });
    } catch (dispErr) {
      console.warn('[FCM Background] Display error:', dispErr?.message);
    }
  }
});

// ─────────────────────────────────────────────────────────────
// Notifee Background Event Handler
// Handles notification press when app is in background/killed state
// ─────────────────────────────────────────────────────────────
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('[Notifee Background] Notification pressed:', detail?.notification?.title);
    // Navigation will be handled by the app when it opens
  }
});

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('AI Expense Tracker', () => App);
AppRegistry.registerComponent('AI-Expense-Tracker', () => App);
AppRegistry.registerComponent('Expenso', () => App);
