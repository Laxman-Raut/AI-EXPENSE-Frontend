import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedCurrency = 'INR';
const USD_TO_INR_RATE = 85.0;

// Attempt to load user preferred currency from storage on boot
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
  if (!currencyCode) return;
  const upper = String(currencyCode).toUpperCase().trim();
  if (upper === '₹' || upper === 'INR' || upper === 'RUPEES' || upper.includes('INR')) {
    cachedCurrency = 'INR';
  } else if (upper === '$' || upper === 'USD' || upper.includes('USD')) {
    cachedCurrency = 'USD';
  } else {
    cachedCurrency = upper;
  }
};

export const getGlobalCurrency = () => cachedCurrency || 'INR';

export const getCurrencySymbol = (currency = null) => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const upper = String(activeCurrency).toUpperCase();
  if (upper === 'USD' || upper === '$') return '$';
  if (upper === 'EUR' || upper === '€') return '€';
  if (upper === 'GBP' || upper === '£') return '£';
  return '₹';
};

/**
 * Converts numeric value between currencies (USD <-> INR)
 */
export const convertCurrencyValue = (amount, fromCurrency = null, toCurrency = null) => {
  const targetCurrency = toCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || targetCurrency;

  if (amount === undefined || amount === null || isNaN(Number(amount))) return 0;
  const num = Number(amount);

  const normalize = (curr) => {
    const upper = String(curr || '').toUpperCase();
    if (upper === '$' || upper === 'USD') return 'USD';
    return 'INR';
  };

  const src = normalize(sourceCurrency);
  const tgt = normalize(targetCurrency);

  if (src === tgt) return num;

  // Convert source -> INR -> target
  const sourceInINR = src === 'USD' ? num * USD_TO_INR_RATE : num;
  if (tgt === 'USD') return sourceInINR / USD_TO_INR_RATE;
  return sourceInINR;
};

/**
 * Formats amount with dynamic numerical conversion & active symbol
 * Accepts: formatCurrency(amount, fromCurrency, targetCurrency)
 */
export const formatCurrency = (amount, fromCurrency = null, targetCurrency = null) => {
  const activeCurrency = targetCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || activeCurrency;
  
  const symbol = getCurrencySymbol(activeCurrency);
  const isUSD = symbol === '$';

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }

  const converted = convertCurrencyValue(amount, sourceCurrency, activeCurrency);
  const absAmount = Math.abs(converted);

  if (!isUSD) {
    const formatted = Math.round(absAmount).toLocaleString('en-IN');
    return `${symbol}${formatted}`;
  }

  const formattedVal =
    absAmount < 10 && absAmount % 1 !== 0
      ? absAmount.toFixed(2)
      : Math.round(absAmount).toLocaleString('en-US');

  return `${symbol}${formattedVal}`;
};

export const formatCompactCurrency = (amount, fromCurrency = null, targetCurrency = null) => {
  const activeCurrency = targetCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || activeCurrency;
  const symbol = getCurrencySymbol(activeCurrency);
  const isUSD = symbol === '$';

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol}0`;
  }

  const converted = convertCurrencyValue(amount, sourceCurrency, activeCurrency);
  const absAmount = Math.abs(converted);

  if (!isUSD) {
    if (absAmount >= 10000000) return `${symbol}${(absAmount / 10000000).toFixed(1)}Cr`;
    if (absAmount >= 100000) return `${symbol}${(absAmount / 100000).toFixed(1)}L`;
  }

  if (absAmount >= 1000) {
    return `${symbol}${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${symbol}${Math.round(absAmount)}`;
};
