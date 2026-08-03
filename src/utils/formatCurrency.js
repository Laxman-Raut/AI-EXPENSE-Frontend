import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedCurrency = 'INR';
const USD_TO_INR_RATE = 85.0;

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

export const setGlobalCurrency = (currencyCode) => {
  if (currencyCode === '₹') cachedCurrency = 'INR';
  else if (currencyCode === '$') cachedCurrency = 'USD';
  else if (currencyCode) cachedCurrency = currencyCode;
};

export const getGlobalCurrency = () => cachedCurrency;

export const getCurrencySymbol = (currency = null) => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  return symbolMap[activeCurrency] || (activeCurrency === 'USD' ? '$' : '₹');
};

/**
 * Converts numeric value between currencies (USD <-> INR)
 * Base transactions are in source currency ('INR' or 'USD').
 */
export const convertCurrencyValue = (amount, fromCurrency = null, toCurrency = null) => {
  const targetCurrency = toCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || targetCurrency;

  if (amount === undefined || amount === null || isNaN(Number(amount))) return 0;
  const num = Number(amount);

  if (sourceCurrency === targetCurrency) return num;

  // Convert source -> INR -> target
  const sourceInINR = (sourceCurrency === 'USD' || sourceCurrency === '$')
    ? num * USD_TO_INR_RATE
    : (sourceCurrency === 'EUR' ? num * 92.0 : num);

  if (targetCurrency === 'USD' || targetCurrency === '$') return sourceInINR / USD_TO_INR_RATE;
  if (targetCurrency === 'EUR') return sourceInINR / 92.0;
  if (targetCurrency === 'GBP') return sourceInINR / 106.0;
  return sourceInINR;
};

/**
 * Formats amount with dynamic numerical conversion & active symbol
 */
export const formatCurrency = (amount, fromCurrency = null, targetCurrency = null) => {
  const activeCurrency = targetCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || activeCurrency;
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbolMap[activeCurrency] || (activeCurrency === 'USD' ? '$' : '₹');

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }

  const converted = convertCurrencyValue(amount, sourceCurrency, activeCurrency);
  const absAmount = Math.abs(converted);

  if (activeCurrency === 'INR') {
    const formatted = Math.round(absAmount).toLocaleString('en-IN');
    return `₹${formatted}`;
  }

  const formattedVal = absAmount < 10 && absAmount % 1 !== 0
    ? absAmount.toFixed(2)
    : Math.round(absAmount).toLocaleString('en-US');

  return `${symbol}${formattedVal}`;
};

export const formatCompactCurrency = (amount, fromCurrency = null, targetCurrency = null) => {
  const activeCurrency = targetCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || activeCurrency;
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbolMap[activeCurrency] || (activeCurrency === 'USD' ? '$' : '₹');

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }

  const converted = convertCurrencyValue(amount, sourceCurrency, activeCurrency);
  const absAmount = Math.abs(converted);

  if (activeCurrency === 'INR') {
    if (absAmount >= 10000000) return `${symbol}${(absAmount / 10000000).toFixed(1)}Cr`;
    if (absAmount >= 100000) return `${symbol}${(absAmount / 100000).toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    return `${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${symbol}${Math.round(absAmount)}`;
};
