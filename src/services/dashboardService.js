import * as api from '../api/dashboard';
import transactionRepository from '../repositories/transactionRepository';
import subscriptionService from './subscriptionService';
import { checkIsConnected } from '../utils/netInfoHelper';
import { getGlobalCurrency, getStoredAmountForCurrency, getExchangeRate } from '../utils/formatCurrency';

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
 * Helper to get user profile from Redux state
 */
const getUserState = () => {
  try {
    const storeModule = require('../store');
    const store = storeModule.default || storeModule.store;
    if (!store || typeof store.getState !== 'function') return {};
    return store.getState()?.auth?.user || {};
  } catch (err) {
    return {};
  }
};

/**
 * Computes Dashboard Summary locally from SQLite transactions for Free / Offline users
 */
export const computeLocalDashboardSummary = async () => {
  const user = getUserState();
  const activeCurrency = user?.currency || getGlobalCurrency() || 'INR';
  const transactions = await transactionRepository.getAll();
  const rate = getExchangeRate() || 95.24;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  let totalIncome = 0;
  let totalExpense = 0;
  let monthlyExpense = 0;
  let monthlyIncome = 0;

  transactions.forEach((t) => {
    const amt = getStoredAmountForCurrency(t, activeCurrency);
    if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'expense') {
      totalExpense += amt;
    }

    const tDate = t.transactionDate ? new Date(t.transactionDate) : new Date(t.createdAt || Date.now());
    if (tDate >= startOfMonth && tDate <= endOfMonth) {
      if (t.type === 'income') monthlyIncome += amt;
      else if (t.type === 'expense') monthlyExpense += amt;
    }
  });

  totalIncome = Number(totalIncome.toFixed(2));
  totalExpense = Number(totalExpense.toFixed(2));
  monthlyIncome = Number(monthlyIncome.toFixed(2));
  monthlyExpense = Number(monthlyExpense.toFixed(2));

  const totalSavings = Math.max(Number((totalIncome - totalExpense).toFixed(2)), 0);

  const spentPercentage = totalIncome > 0
    ? Math.min(Number(((totalExpense / totalIncome) * 100).toFixed(1)), 100)
    : (totalExpense > 0 ? 100 : 0);

  const savedPercentage = totalIncome > 0
    ? Math.max(Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)), 0)
    : 0;

  const rawBudget = Number(user.monthlyBudget) || 50000;
  const budgetLimit = activeCurrency === 'USD'
    ? (user.monthlyBudgetUSD && user.monthlyBudgetUSD > 0 ? user.monthlyBudgetUSD : Number((rawBudget / rate).toFixed(2)))
    : (user.monthlyBudgetINR && user.monthlyBudgetINR > 0 ? user.monthlyBudgetINR : rawBudget);

  const budgetRemaining = Math.max(Number((budgetLimit - monthlyExpense).toFixed(2)), 0);
  const budgetUtilizationPercentage = budgetLimit > 0
    ? Number(((monthlyExpense / budgetLimit) * 100).toFixed(1))
    : 0;

  return {
    totalIncome,
    totalExpense,
    balance: Number((totalIncome - totalExpense).toFixed(2)),
    totalSavings,
    monthlyIncome,
    monthlyExpense,
    currency: activeCurrency,
    transactionCount: transactions.length,
    incomeSpentVsSaved: {
      totalIncome,
      totalExpense,
      totalSavings,
      spentPercentage,
      savedPercentage,
    },
    monthlyBudgetLimit: {
      budgetLimit,
      budgetSpent: monthlyExpense,
      budgetRemaining,
      utilizationPercentage: budgetUtilizationPercentage,
    },
  };
};

/**
 * Fetch Dashboard Summary (From MongoDB for Pro users, from SQLite for Free/Offline users)
 */
export const fetchDashboardSummary = async () => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const summary = await api.fetchDashboardSummary();
      if (summary) return summary;
    } catch (error) {
      console.warn('Cloud dashboard fetch failed, calculating from local SQLite:', error.message);
    }
  }

  return await computeLocalDashboardSummary();
};

/**
 * Fetch Recent Transactions (From MongoDB for Pro users, from SQLite for Free/Offline users)
 */
export const fetchRecentTransactions = async () => {
  const isPro = isUserPro();
  const isConnected = await checkIsConnected();

  if (isPro && isConnected) {
    try {
      const txns = await api.fetchRecentTransactions();
      if (Array.isArray(txns) && txns.length > 0) return txns;
    } catch (error) {
      console.warn('Cloud recent transactions fetch failed, returning local SQLite data:', error.message);
    }
  }

  const allTxns = await transactionRepository.getAll();
  return allTxns.slice(0, 5);
};
