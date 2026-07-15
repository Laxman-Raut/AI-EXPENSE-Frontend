let cachedCurrency: string = 'INR';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Attempt to load from storage on boot
AsyncStorage.getItem('user').then((storedUser) => {
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.currency) {
        cachedCurrency = user.currency;
      }
    } catch {}
  }
});

export const setGlobalCurrency = (currencyCode: string): void => {
  cachedCurrency = currencyCode;
};

export const formatCurrency = (amount: number, currency: string | null = null): string => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const absAmount = Math.abs(amount);
  
  if (activeCurrency === 'INR') {
    // Indian number formatting (e.g., 1,23,456.00)
    const formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `₹${formatted}`;
  }
  
  try {
    return absAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    const symbolMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    const symbol = symbolMap[activeCurrency] || activeCurrency;
    return `${symbol}${absAmount.toFixed(2)}`;
  }
};

export const formatCompactCurrency = (amount: number, currency: string | null = null): string => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const symbolMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbolMap[activeCurrency] || '₹';
  
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `${symbol}${(absAmount / 10000000).toFixed(1)}Cr`;
  }
  if (absAmount >= 100000) {
    return `${symbol}${(absAmount / 100000).toFixed(1)}L`;
  }
  if (absAmount >= 1000) {
    return `${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${symbol}${absAmount}`;
};
