import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import subscriptionService from './subscriptionService';

// ─── Official Google AdMob TEST IDs ──────────────────────────────────────────
// STRICT REQUIREMENT: Test ads only. Do not use production IDs in test config.
export const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';

export const USE_TEST_ADS = true;
export const AD_UNIT_GROUP_CREATION = TEST_INTERSTITIAL_AD_UNIT_ID;
export const AD_UNIT_ANALYTICS = TEST_INTERSTITIAL_AD_UNIT_ID;
export const AD_UNIT_RECURRING = TEST_INTERSTITIAL_AD_UNIT_ID;

// ─── Analytics Ad Frequency Limits ──────────────────────────────────────────
export const ANALYTICS_MAX_DAILY_ADS = 10;
export const ANALYTICS_AD_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown

const AD_LOAD_TIMEOUT_MS = 5000; // 5s timeout to avoid freezing user flows
const ANALYTICS_AD_STATE_KEY = '@aet/analytics_interstitial_state';

import mobileAds, {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

// ─── Premium Protection ─────────────────────────────────────────────────────
/**
 * Synchronously checks if the current user has an active Pro/Premium subscription
 * using the latest Redux subscription state and the existing subscriptionService.
 */
export const isUserPremium = () => {
  try {
    const state = store.getState();
    const subscription = state?.subscription;
    return subscriptionService.isSubscriptionPro(subscription);
  } catch (error) {
    console.warn('[Ads] Error reading subscription state from store:', error);
    return false;
  }
};

// ─── SDK Initialization ─────────────────────────────────────────────────────
let initializationPromise = null;

/**
 * Initializes the Google Mobile Ads SDK once at startup.
 */
export const initializeAds = () => {
  if (Platform.OS !== 'android') {
    return Promise.resolve(false);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  if (!mobileAds) {
    console.log('[Ads] SDK initialization skipped: Google Mobile Ads SDK is not linked/available.');
    initializationPromise = Promise.resolve(false);
    return initializationPromise;
  }

  console.log('[Ads] Initializing Google Mobile Ads SDK (Test Mode)...');
  initializationPromise = mobileAds()
    .initialize()
    .then((adapterStatuses) => {
      console.log('[Ads] Google Mobile Ads SDK initialized successfully.', adapterStatuses);
      return true;
    })
    .catch((error) => {
      console.error('[Ads] Google Mobile Ads SDK initialization failed:', error);
      return false;
    });

  return initializationPromise;
};

// ─── Analytics Cooldown & Frequency State ───────────────────────────────────
const getLocalDayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getAnalyticsAdState = async () => {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_AD_STATE_KEY);
    if (!raw) {
      return { date: getLocalDayKey(), shownCount: 0, lastShownTimestamp: 0 };
    }
    const state = JSON.parse(raw);
    if (state.date !== getLocalDayKey()) {
      return { date: getLocalDayKey(), shownCount: 0, lastShownTimestamp: 0 };
    }
    return state;
  } catch (error) {
    console.warn('[Ads] Failed to read analytics ad state:', error);
    return { date: getLocalDayKey(), shownCount: 0, lastShownTimestamp: 0 };
  }
};

export const saveAnalyticsAdState = async (state) => {
  try {
    await AsyncStorage.setItem(ANALYTICS_AD_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[Ads] Failed to save analytics ad state:', error);
  }
};

export const canShowAnalyticsAd = async () => {
  if (isUserPremium()) {
    return { canShow: false, reason: 'premium_user' };
  }

  const now = Date.now();
  const state = await getAnalyticsAdState();

  if (state.shownCount >= ANALYTICS_MAX_DAILY_ADS) {
    return { canShow: false, reason: 'daily_limit_reached', shownCount: state.shownCount };
  }

  if (state.lastShownTimestamp && now - state.lastShownTimestamp < ANALYTICS_AD_COOLDOWN_MS) {
    const remainingMs = ANALYTICS_AD_COOLDOWN_MS - (now - state.lastShownTimestamp);
    return { canShow: false, reason: 'cooldown_active', remainingMs };
  }

  return { canShow: true, shownCount: state.shownCount };
};

export const recordAnalyticsAdShown = async () => {
  const now = Date.now();
  const state = await getAnalyticsAdState();
  const nextState = {
    date: getLocalDayKey(),
    shownCount: (state.shownCount || 0) + 1,
    lastShownTimestamp: now,
  };
  await saveAnalyticsAdState(nextState);
  return nextState;
};

export const resetAnalyticsAdState = async () => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_AD_STATE_KEY);
  } catch (error) {
    console.warn('[Ads] Failed to reset analytics ad state:', error);
  }
};

// ─── Mutex & Show Logic ─────────────────────────────────────────────────────
let isAdActive = false;

/**
 * Loads and displays a single TEST interstitial ad for Free users.
 * Resolves true if shown and dismissed, false on any error/timeout/skipping.
 * Never throws or blocks user flow.
 */
const _showInterstitialTestAd = async (placement) => {
  if (Platform.OS !== 'android') {
    console.log(`[Ads] ${placement}: Interstitial skipped on non-Android platform.`);
    return false;
  }

  // Double check Premium status at trigger time
  if (isUserPremium()) {
    console.log(`[Ads] ${placement}: Premium user. Ad skipped.`);
    return false;
  }

  // Prevent multiple simultaneous interstitials
  if (isAdActive) {
    console.log(`[Ads] ${placement}: Another ad is already active. Skipping request.`);
    return false;
  }

  if (!InterstitialAd || !AdEventType) {
    console.log(`[Ads] ${placement}: Google Mobile Ads SDK is not loaded. Continuing without ad.`);
    return false;
  }

  const initialized = await initializeAds();
  if (!initialized) {
    console.log(`[Ads] ${placement}: Ads SDK not initialized. Continuing without ad.`);
    return false;
  }

  isAdActive = true;
  console.log(`[Ads] ${placement}: Requesting TEST interstitial ad (${TEST_INTERSTITIAL_AD_UNIT_ID})...`);

  return new Promise((resolve) => {
    let isFinished = false;
    let showRequested = false;
    let loadTimeout = null;
    let adInstance = null;
    const subscriptions = [];

    const cleanup = () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      subscriptions.forEach((unsub) => {
        try {
          unsub();
        } catch (_) {}
      });
      subscriptions.length = 0;
      if (adInstance) {
        try {
          adInstance.destroy();
        } catch (_) {}
        adInstance = null;
      }
      isAdActive = false;
    };

    const finish = (wasShown, message, error = null) => {
      if (isFinished) return;
      isFinished = true;
      cleanup();

      if (error) {
        console.warn(`[Ads] ${placement}: ${message}`, error?.message || error);
      } else {
        console.log(`[Ads] ${placement}: ${message}`);
      }
      resolve(wasShown);
    };

    try {
      adInstance = InterstitialAd.createForAdRequest(TEST_INTERSTITIAL_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = adInstance.addAdEventListener(AdEventType.LOADED, () => {
        console.log(`[Ads] ${placement}: Test interstitial loaded successfully. Showing ad...`);
        showRequested = true;
        try {
          adInstance.show();
        } catch (showErr) {
          finish(false, 'Failed to show ad after load', showErr);
        }
      });

      const unsubOpened = adInstance.addAdEventListener(AdEventType.OPENED, () => {
        console.log(`[Ads] ${placement}: Test interstitial opened on screen.`);
      });

      const unsubClosed = adInstance.addAdEventListener(AdEventType.CLOSED, () => {
        finish(true, 'Test interstitial closed by user.');
      });

      const unsubError = adInstance.addAdEventListener(AdEventType.ERROR, (err) => {
        finish(false, 'Test interstitial encountered an error', err);
      });

      subscriptions.push(unsubLoaded, unsubOpened, unsubClosed, unsubError);

      loadTimeout = setTimeout(() => {
        if (!showRequested) {
          finish(false, `Ad load timed out (${AD_LOAD_TIMEOUT_MS}ms); continuing without ad.`);
        }
      }, AD_LOAD_TIMEOUT_MS);

      adInstance.load();
    } catch (createErr) {
      finish(false, 'Exception creating or loading test interstitial ad', createErr);
    }
  });
};

// ─── Placement A — Analytics ────────────────────────────────────────────────
/**
 * Shows test interstitial ad when Free user opens Analytics.
 * Guarded by daily limit and cooldown. Never blocks navigation.
 */
export const showAnalyticsAd = async (placement = 'analytics') => {
  if (isUserPremium()) {
    console.log(`[Ads] ${placement}: Premium user. Ad skipped.`);
    return false;
  }

  const eligibility = await canShowAnalyticsAd();
  if (!eligibility.canShow) {
    console.log(`[Ads] ${placement}: Analytics ad skipped (${eligibility.reason}).`);
    return false;
  }

  const shown = await _showInterstitialTestAd(placement);
  if (shown) {
    await recordAnalyticsAdShown();
  }
  return shown;
};

// ─── Placement B — Recurring Automation ─────────────────────────────────────
/**
 * Shows test interstitial ad when Free user starts creating a recurring automation.
 * Never blocks creation flow.
 */
export const showRecurringAutomationAd = async (placement = 'recurring_automation') => {
  if (isUserPremium()) {
    console.log(`[Ads] ${placement}: Premium user. Ad skipped.`);
    return false;
  }

  return await _showInterstitialTestAd(placement);
};

// ─── Placement C — Group Creation ───────────────────────────────────────────
/**
 * Shows test interstitial ad when Free user creates a group.
 * Never blocks group creation.
 */
export const showGroupCreationAd = async (placement = 'group_creation') => {
  if (isUserPremium()) {
    console.log(`[Ads] ${placement}: Premium user. Ad skipped.`);
    return false;
  }

  return await _showInterstitialTestAd(placement);
};

// ─── Legacy Alias ───────────────────────────────────────────────────────────
export const showInterstitialAd = async (placement = 'unspecified') => {
  return await showAnalyticsAd(placement);
};
