let cachedCurrency = 'INR';

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

export const setGlobalCurrency = (currencyCode) => {
  cachedCurrency = currencyCode;
};

export const formatCurrency = (amount, currency = null) => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return activeCurrency === 'INR' ? '₹0' : activeCurrency === 'USD' ? '$0' : activeCurrency === 'EUR' ? '€0' : activeCurrency === 'GBP' ? '£0' : '0';
  }
  const absAmount = Math.abs(amount);
  
  if (activeCurrency === 'INR') {
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
    const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    const symbol = symbolMap[activeCurrency] || activeCurrency;
    return `${symbol}${absAmount.toFixed(2)}`;
  }
};

export const formatCompactCurrency = (amount, currency = null) => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbolMap[activeCurrency] || '₹';

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }
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
