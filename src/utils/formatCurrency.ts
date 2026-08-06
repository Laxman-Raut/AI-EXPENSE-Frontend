let cachedCurrency: string = 'INR';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Attempt to load from storage on boot
AsyncStorage.getItem('user').then((storedUser) => {
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.currency) {
        setGlobalCurrency(user.currency);
      }
    } catch {}
  }
});

export const setGlobalCurrency = (currencyCode: string): void => {
  if (currencyCode === '₹' || currencyCode === 'INR' || currencyCode === 'Rupees') {
    cachedCurrency = 'INR';
  } else if (currencyCode === '$' || currencyCode === 'USD') {
    cachedCurrency = 'USD';
  } else if (currencyCode) {
    cachedCurrency = currencyCode;
  }
};

export const formatCurrency = (amount: number, currency: string | null = null): string => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const absAmount = Math.abs(amount);
  const isUSD = activeCurrency === 'USD' || activeCurrency === '$';
  
  if (!isUSD) {
    // Indian number formatting (e.g., ₹1,23,456)
    const formatted = Math.round(absAmount).toLocaleString('en-IN');
    return `₹${formatted}`;
  }
  
  const formattedVal = absAmount < 10 && absAmount % 1 !== 0
    ? absAmount.toFixed(2)
    : Math.round(absAmount).toLocaleString('en-US');

  return `$${formattedVal}`;
};

export const formatCompactCurrency = (amount: number, currency: string | null = null): string => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const isUSD = activeCurrency === 'USD' || activeCurrency === '$';
  const symbol = isUSD ? '$' : '₹';
  
  const absAmount = Math.abs(amount);
  if (!isUSD) {
    if (absAmount >= 10000000) return `${symbol}${(absAmount / 10000000).toFixed(1)}Cr`;
    if (absAmount >= 100000) return `${symbol}${(absAmount / 100000).toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    return `${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${symbol}${Math.round(absAmount)}`;
};
