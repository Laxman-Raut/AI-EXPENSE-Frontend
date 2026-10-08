import { hasNotification, saveNotification } from './notificationStorage';
import {
  displayLocalNotification,
  ensureNotificationChannel,
  requestNotificationPermission,
} from './pushNotificationService';
class NotificationService {
  async initialize() {
    const granted = await requestNotificationPermission();
    if (granted) await ensureNotificationChannel();
  }

  async show(title: string, body: string, id = Date.now().toString()) {
    if (await hasNotification(id)) return;

    await displayLocalNotification(title, body);

    await saveNotification({
      id,
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
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (percentage >= 80 && percentage < 100) {
      await this.show(
        '⚠️ Budget Alert',
        `You've spent 80% of your monthly budget.`,
        `budget-${monthKey}-80`,
      );
    }

    if (percentage >= 100) {
      await this.show(
        'Monthly Budget Reached',
        'You have reached 100% of your monthly budget.',
        `budget-${monthKey}-100`,
      );
    }

    if (percentage > 100) {
      await this.show(
        '🚨 Budget Exceeded',
        'You have exceeded your monthly budget.',
        `budget-${monthKey}-exceeded`,
      );
    }
  }
}

export default new NotificationService();
