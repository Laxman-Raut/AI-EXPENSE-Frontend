import * as api from '../api/transactions';
import transactionRepository from '../repositories/transactionRepository';
import subscriptionService from './subscriptionService';
import { checkIsConnected } from '../utils/netInfoHelper';

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

/**
 * Fetch transactions (From MongoDB for Pro users, from SQLite for Free/Offline users)
 */
export const fetchTransactions = async () => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const response = await api.fetchTransactions();
      if (response && response.success && Array.isArray(response.data)) {
        // Cache fetched cloud transactions into local SQLite
        await transactionRepository.cacheCloudTransactions(response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('Cloud fetch failed, returning local SQLite data:', error.message);
    }
  }

  return await transactionRepository.getAll();
};

/**
 * Fetch single transaction by ID
 */
export const fetchTransaction = async (id) => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const response = await api.fetchTransaction(id);
      if (response && response.success) {
        return response.data;
      }
    } catch (error) {
      console.warn('Cloud fetch transaction failed, returning local SQLite data:', error.message);
    }
  }

  return await transactionRepository.getById(id);
};

/**
 * Create transaction (MongoDB for Pro users, local SQLite for Free users)
 */
export const createTransaction = async (data) => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const response = await api.createTransaction(data);
      if (response && response.success) {
        const cloudItem = response.data;
        await transactionRepository.add({
          ...data,
          cloudId: cloudItem._id,
          isSynced: 1,
        });
        return cloudItem;
      }
    } catch (error) {
      console.warn('Cloud creation failed, storing in SQLite for later sync:', error.message);
    }
  }

  // Free Tier or Offline: Save locally with isSynced = 0
  return await transactionRepository.add({
    ...data,
    isSynced: 0,
  });
};

/**
 * Update transaction
 */
export const updateTransaction = async (id, data) => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const response = await api.updateTransaction(id, data);
      if (response && response.success) {
        await transactionRepository.update({
          ...data,
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
    ...data,
    id,
    isSynced: 0,
  });
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id) => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  const localRecord = await transactionRepository.getById(id);
  const cloudId = localRecord?.cloudId || id;

  if (isPro && isConnected && cloudId) {
    try {
      await api.deleteTransaction(cloudId);
    } catch (error) {
      console.warn('Cloud deletion failed, deleting locally:', error.message);
    }
  }

  return await transactionRepository.delete(id);
};