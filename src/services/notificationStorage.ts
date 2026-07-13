import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'notifications';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const saveNotification = async (
  notification: AppNotification,
) => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);

    const notifications: AppNotification[] = existing
      ? JSON.parse(existing)
      : [];

    notifications.unshift(notification);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications),
    );
  } catch (error) {
    console.log(error);
  }
};

export const getNotifications = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const clearNotifications = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
