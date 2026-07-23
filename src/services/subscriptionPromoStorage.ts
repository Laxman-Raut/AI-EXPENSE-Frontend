import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const PROMO_STORAGE_KEY = '@subscription_promo_daily_tracker';
const MAX_DAILY_LIMIT = 5;

interface PromoTracker {
  date: string;
  count: number;
}

/**
 * Checks if the daily subscription promo should be shown to a non-subscriber.
 * Allows a maximum of 5 impressions per day.
 */
export const checkAndIncrementDailyPromo = async (isProUser: boolean): Promise<boolean> => {
  if (isProUser) return false;

  try {
    const today = dayjs().format('YYYY-MM-DD');
    const rawData = await AsyncStorage.getItem(PROMO_STORAGE_KEY);
    let tracker: PromoTracker = rawData ? JSON.parse(rawData) : { date: today, count: 0 };

    // Reset counter if it's a new day
    if (tracker.date !== today) {
      tracker = { date: today, count: 0 };
    }

    if (tracker.count < MAX_DAILY_LIMIT) {
      tracker.count += 1;
      await AsyncStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(tracker));
      console.log(`[SubscriptionPromo] Impression ${tracker.count}/${MAX_DAILY_LIMIT} for today (${today})`);
      return true;
    }

    console.log(`[SubscriptionPromo] Daily limit of ${MAX_DAILY_LIMIT} impressions reached for today (${today})`);
    return false;
  } catch (error) {
    console.error('[SubscriptionPromo] Storage error:', error);
    return false;
  }
};
