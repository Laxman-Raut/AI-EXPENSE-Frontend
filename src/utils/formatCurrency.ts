import AsyncStorage from '@react-native-async-storage/async-storage';

let cachedCurrency: string = 'INR';

// Dynamic exchange rate — updated from backend API on app startup
// Falls back to 85.0 if API is unreachable
let cachedUsdToInr: number = 85.0;
let cachedRatesMap: Record<string, number> | null = null;

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

/**
 * Update the cached exchange rate from backend API response.
 * Called on app startup after fetching GET /api/currency/rates
 */
export const setExchangeRate = (usdToInr: number, ratesMap?: Record<string, number>): void => {
  if (usdToInr && usdToInr > 0) {
    cachedUsdToInr = usdToInr;
  }
  if (ratesMap && typeof ratesMap === 'object') {
    cachedRatesMap = ratesMap;
  }
};

/**
 * Fetch live exchange rates from backend and cache them.
 * Call this on app startup (e.g., in AppNavigator or after login).
 */
export const fetchAndCacheExchangeRate = async (apiClient: any): Promise<void> => {
  try {
    const response = await apiClient.get('v1/currency/rates');
    if (response?.data?.success && response?.data?.data) {
      const rateData = response.data.data;
      if (rateData.usdToInr && rateData.usdToInr > 0) {
        cachedUsdToInr = rateData.usdToInr;
      }
      if (rateData.rates) {
        cachedRatesMap = rateData.rates;
      }
      console.log('[Currency] Live exchange rate loaded:', cachedUsdToInr);
    }
  } catch (err: any) {
    console.warn('[Currency] Failed to fetch live rates, using fallback:', err?.message);
  }
};

export const getExchangeRate = (): number => cachedUsdToInr;

export const setGlobalCurrency = (currencyCode: string | null | undefined): void => {
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

export const getGlobalCurrency = (): string => cachedCurrency || 'INR';

export const getCurrencySymbol = (currency: string | null = null): string => {
  const activeCurrency = currency || cachedCurrency || 'INR';
  const upper = String(activeCurrency).toUpperCase();
  if (upper === 'USD' || upper === '$') return '$';
  if (upper === 'EUR' || upper === '€') return '€';
  if (upper === 'GBP' || upper === '£') return '£';
  return '₹';
};

/**
 * Converts numeric value between currencies using live rates from backend.
 * Uses the full ratesMap when available for multi-currency support.
 */
export const convertCurrencyValue = (
  amount: number | string,
  fromCurrency: string | null = null,
  toCurrency: string | null = null
): number => {
  const targetCurrency = toCurrency || cachedCurrency || 'INR';
  const sourceCurrency = fromCurrency || targetCurrency;

  if (amount === undefined || amount === null || isNaN(Number(amount))) return 0;
  const num = Number(amount);

  const normalize = (curr: string) => {
    const upper = String(curr || '').toUpperCase();
    if (upper === '$' || upper === 'USD') return 'USD';
    if (upper === '₹' || upper === 'INR') return 'INR';
    if (upper === '€' || upper === 'EUR') return 'EUR';
    if (upper === '£' || upper === 'GBP') return 'GBP';
    return upper;
  };

  const src = normalize(sourceCurrency);
  const tgt = normalize(targetCurrency);

  if (src === tgt) return num;

  // Use full rates map if available for multi-currency precision
  if (cachedRatesMap && cachedRatesMap[src] && cachedRatesMap[tgt]) {
    const fromRate = Number(cachedRatesMap[src]);
    const toRate = Number(cachedRatesMap[tgt]);
    if (fromRate > 0 && toRate > 0) {
      return Number(((num / fromRate) * toRate).toFixed(2));
    }
  }

  // Fallback to simple USD<->INR conversion using cached rate
  const sourceInINR = src === 'USD' ? num * cachedUsdToInr : num;
  if (tgt === 'USD') return Number((sourceInINR / cachedUsdToInr).toFixed(2));
  return Number(sourceInINR.toFixed(2));
};

/**
 * Formats amount with dynamic numerical conversion & active symbol.
 * Uses live exchange rates from backend API.
 */
export const formatCurrency = (
  amount: number | string,
  fromCurrency: string | null = null,
  targetCurrency: string | null = null
): string => {
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

export const formatCompactCurrency = (
  amount: number | string,
  fromCurrency: string | null = null,
  targetCurrency: string | null = null
): string => {
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
