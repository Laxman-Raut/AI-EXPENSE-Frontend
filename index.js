/**
 * @format
 */

import 'react-native-gesture-handler';
import './src/theme/ThemeManager';
import { AppRegistry } from 'react-native';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// ─────────────────────────────────────────────────────────────
// FCM Background Message Handler
// This runs when the app is KILLED or in BACKGROUND.
// When an FCM message contains a 'notification' payload, Android
// automatically displays it in the notification tray.
// We only display via Notifee if it's a data-only payload (no duplicate!).
// ─────────────────────────────────────────────────────────────
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background] Message received:', remoteMessage?.notification?.title || remoteMessage?.data?.title);

  // If FCM already included a notification payload, Android OS displays it natively.
  // We avoid calling Notifee here to prevent showing 2 duplicate banners for the same message!
  if (!remoteMessage?.notification && (remoteMessage?.data?.title || remoteMessage?.data?.body)) {
    const title = remoteMessage?.data?.title || 'Notification';
    const body = remoteMessage?.data?.body || '';

    // Ensure channel exists
    await notifee.createChannel({
      id: 'expense-tracker',
      name: 'Expenso',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Display notification on lockscreen
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'expense-tracker',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      data: remoteMessage?.data || {},
    });
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
