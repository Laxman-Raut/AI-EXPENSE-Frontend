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
// It receives the FCM message and displays a local notification
// via Notifee so it appears on the lockscreen/homescreen.
// ─────────────────────────────────────────────────────────────
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background] Message received:', remoteMessage?.notification?.title);

  const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Notification';
  const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

  // Ensure channel exists
  await notifee.createChannel({
    id: 'expense-tracker',
    name: 'Expense Tracker',
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
