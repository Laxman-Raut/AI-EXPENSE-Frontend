import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import { saveNotification } from './notificationStorage';
class NotificationService {
  async initialize() {
    // Request permission
    const settings = await notifee.requestPermission();

    if (
      settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
    ) {
      console.log('Notification permission granted');
    } else {
      console.log('Notification permission denied');
    }

    // Create notification channel
    await notifee.createChannel({
      id: 'expense-tracker',
      name: 'Expense Tracker',
      importance: AndroidImportance.HIGH,
    });
  }

 async show(title: string, body: string) {
  // Display notification
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'expense-tracker',
      pressAction: {
        id: 'default',
      },
    },
  });

  // Save notification locally
  await saveNotification({
    id: Date.now().toString(),
    title,
    body,
    time: new Date().toLocaleString(),
    read: false,
  });
}
  async checkBudgetAlert(
    monthlyBudget: number,
    totalSpent: number,
  ) {
    if (monthlyBudget <= 0) return;

    const percentage = (totalSpent / monthlyBudget) * 100;

    if (percentage >= 80 && percentage < 100) {
      await this.show(
        '⚠️ Budget Alert',
        `You've used ${percentage.toFixed(0)}% of your monthly budget.`,
      );
    }

    if (percentage >= 100) {
      await this.show(
        '🚨 Budget Exceeded',
        'You have exceeded your monthly budget.',
      );
    }
  }
}

export default new NotificationService();