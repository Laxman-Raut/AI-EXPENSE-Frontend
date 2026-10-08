import * as api from '../api/transactions';
import transactionRepository from '../repositories/transactionRepository';
import subscriptionService from './subscriptionService';
import { checkIsConnected } from '../utils/netInfoHelper';
import notificationService from './notificationService';

/**
 * Helper to check if current user has an active Pro subscription
 */
const isUserPro = () => {
  try {
    const storeModule = require('../store');
    const store = storeModule.default || storeModule.store;
    if (!store || typeof store.getState !== 'function') return false;
    const state = store.getState();
    const subscription = state?.subscription;
    return subscriptionService.isSubscriptionPro(subscription);
  } catch (err) {
    return false;
  }
};

const getCurrentUser = () => {
  try {
    const storeModule = require('../store');
    const store = storeModule.default || storeModule.store;
    if (!store || typeof store.getState !== 'function') return null;
    const state = store.getState();
    return state?.auth?.user || null;
  } catch (err) {
    return null;
  }
};

/**
 * Fetch transactions (From MongoDB when connected, fallback to SQLite when offline)
 */
export const fetchTransactions = async () => {
  const user = getCurrentUser();
  const userId = user?._id || user?.email || null;

  if (isUserPro() && (await checkIsConnected()) && userId) {
    try {
      const response = await api.fetchTransactions();
      if (response && response.success && Array.isArray(response.data)) {
        // Cache fetched cloud transactions into local SQLite tagged with current userId
        await transactionRepository.cacheCloudTransactions(response.data, userId);
        return response.data;
      }
    } catch (error) {
      console.warn('Cloud fetch failed, returning local SQLite data:', error.message);
    }
  }

  return await transactionRepository.getAll(userId);
};

/**
 * Fetch single transaction by ID
 */
export const fetchTransaction = async (id) => {
  const user = getCurrentUser();
  const userId = user?._id || user?.email || null;

  if (isUserPro() && (await checkIsConnected()) && userId) {
    try {
      const response = await api.fetchTransaction(id);
      if (response && response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('Cloud fetch transaction failed, returning local SQLite data:', error.message);
    }
  }

  return await transactionRepository.getById(id, userId);
};

/**
 * Create transaction (MongoDB when connected, local SQLite when offline)
 */
export const createTransaction = async (data) => {
  const isConnected = await checkIsConnected();
  const user = getCurrentUser();
  const userId = data.userId || user?._id || user?.email || null;
  const canUseCloud = isUserPro() && isConnected && !!userId;

  const payload = {
    ...data,
    userId,
  };

  let savedRecord = null;

  if (canUseCloud) {
    try {
      const response = await api.createTransaction(payload);
      if (response && response.success) {
        const cloudItem = response.data;
        await transactionRepository.add({
          ...payload,
          ...cloudItem,
          cloudId: cloudItem._id,
          isSynced: 1,
        });
        savedRecord = cloudItem;
      }
    } catch (error) {
      console.warn('Cloud creation failed, storing in SQLite for later sync:', error.message);
    }
  }

  // If cloud save didn't succeed (offline or non-logged-in), save to local SQLite
  if (!savedRecord) {
    savedRecord = await transactionRepository.add({
      ...payload,
      isSynced: 0,
    });
  }

  // Run local budget alert check ONLY when offline (cloud handles it when online via FCM)
  try {
    if ((!isConnected || !isUserPro()) && data.type === 'expense' && user) {
      const monthlyBudget = Number(user.monthlyBudgetINR || user.monthlyBudget || 0);
      if (monthlyBudget > 0) {
        const allTxns = await transactionRepository.getAll(userId);
        const now = new Date();
        const currentMonthExpenses = (allTxns || []).filter(t => {
          if (t.type !== 'expense') return false;
          const d = new Date(t.transactionDate || t.createdAt || now);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const totalSpent = currentMonthExpenses.reduce((sum, t) => sum + Number(t.amountINR || t.amount || 0), 0);
        await notificationService.checkBudgetAlert(monthlyBudget, totalSpent);
      }
    }
  } catch (alertErr) {
    console.warn('[TransactionService] Local budget alert check error:', alertErr.message);
  }

  return savedRecord;
};

/**
 * Update transaction
 */
export const updateTransaction = async (id, data) => {
  const isConnected = await checkIsConnected();
  const user = getCurrentUser();
  const userId = data.userId || user?._id || user?.email || null;
  const canUseCloud = isUserPro() && isConnected && !!userId;

  const payload = {
    ...data,
    userId,
  };

  if (canUseCloud) {
    try {
      const response = await api.updateTransaction(id, payload);
      if (response && response.success) {
        await transactionRepository.update({
          ...payload,
          ...response.data,
          id,
          isSynced: 1,
        });
        return response.data;
      }
    } catch (error) {
      console.warn('Cloud update failed, updating local SQLite:', error.message);
    }
  }

  return await transactionRepository.update({
    ...payload,
    id,
    isSynced: 0,
  });
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id) => {
  const isConnected = await checkIsConnected();
  const user = getCurrentUser();
  const userId = user?._id || user?.email || null;
  const canUseCloud = isUserPro() && isConnected && !!userId;

  const localRecord = await transactionRepository.getById(id, userId);
  const cloudId = localRecord?.cloudId;

  if (canUseCloud && cloudId) {
    try {
      await api.deleteTransaction(cloudId);
    } catch (error) {
      console.warn('Cloud deletion failed, deleting locally:', error.message);
    }
  }

  return await transactionRepository.delete(id);
};
