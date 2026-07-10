import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAppStore = create((set) => ({
  theme: 'light', // 'dark' or 'light'
  currency: '₹', // '₹', '$', '€', etc.
  monthlyBudget: 50000,
  notificationsEnabled: true,
  isInitialized: false,

  initStore: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('app_theme');
      const storedCurrency = await AsyncStorage.getItem('app_currency');
      const storedBudget = await AsyncStorage.getItem('app_budget');
      const storedNotifications = await AsyncStorage.getItem('app_notifications');

      const updates = {};
      if (storedTheme) updates.theme = storedTheme;
      if (storedCurrency) updates.currency = storedCurrency;
      if (storedBudget) updates.monthlyBudget = Number(storedBudget);
      if (storedNotifications) updates.notificationsEnabled = storedNotifications === 'true';
      updates.isInitialized = true;

      set(updates);
    } catch (error) {
      console.error('Error initializing Zustand store:', error);
      set({ isInitialized: true });
    }
  },

  setTheme: async (theme) => {
    try {
      await AsyncStorage.setItem('app_theme', theme);
      set({ theme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  setCurrency: async (currency) => {
    try {
      await AsyncStorage.setItem('app_currency', currency);
      set({ currency });
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  },

  setMonthlyBudget: async (monthlyBudget) => {
    try {
      await AsyncStorage.setItem('app_budget', String(monthlyBudget));
      set({ monthlyBudget });
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  },

  setNotificationsEnabled: async (enabled) => {
    try {
      await AsyncStorage.setItem('app_notifications', String(enabled));
      set({ notificationsEnabled: enabled });
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  },
}));

export default useAppStore;
