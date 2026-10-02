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

  if (title || body) {
    try {
      // Ensure high-importance notification channel exists
      await notifee.createChannel({
        id: 'expense-tracker',
        name: 'Expenso',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Display notification on status bar / lockscreen
      await notifee.displayNotification({
        id: remoteMessage?.messageId || Date.now().toString(),
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
