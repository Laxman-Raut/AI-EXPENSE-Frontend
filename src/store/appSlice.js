import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const initStore = createAsyncThunk('app/initStore', async () => {
  const storedTheme = await AsyncStorage.getItem('app_theme');
  const storedCurrency = await AsyncStorage.getItem('app_currency');
  const storedBudget = await AsyncStorage.getItem('app_budget');
  const storedNotifications = await AsyncStorage.getItem('app_notifications');

  return {
    theme: storedTheme || 'light',
    currency: storedCurrency || '₹',
    monthlyBudget: storedBudget ? Number(storedBudget) : 50000,
    notificationsEnabled: storedNotifications !== 'false', // default to true
  };
});

export const setTheme = createAsyncThunk('app/setTheme', async (theme) => {
  await AsyncStorage.setItem('app_theme', theme);
  return theme;
});

export const setCurrency = createAsyncThunk('app/setCurrency', async (currency) => {
  await AsyncStorage.setItem('app_currency', currency);
  return currency;
});

export const setMonthlyBudget = createAsyncThunk('app/setMonthlyBudget', async (budget) => {
  await AsyncStorage.setItem('app_budget', String(budget));
  return Number(budget);
});

export const setNotificationsEnabled = createAsyncThunk('app/setNotificationsEnabled', async (enabled) => {
  await AsyncStorage.setItem('app_notifications', String(enabled));
  return enabled;
});

const appSlice = createSlice({
  name: 'app',
  initialState: {
    theme: 'light',
    currency: '₹',
    monthlyBudget: 50000,
    notificationsEnabled: true,
    isInitialized: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initStore.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.currency = action.payload.currency;
        state.monthlyBudget = action.payload.monthlyBudget;
        state.notificationsEnabled = action.payload.notificationsEnabled;
        state.isInitialized = true;
      })
      .addCase(setTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      })
      .addCase(setCurrency.fulfilled, (state, action) => {
        state.currency = action.payload;
      })
      .addCase(setMonthlyBudget.fulfilled, (state, action) => {
        state.monthlyBudget = action.payload;
      })
      .addCase(setNotificationsEnabled.fulfilled, (state, action) => {
        state.notificationsEnabled = action.payload;
      });
  },
});

export default appSlice.reducer;
