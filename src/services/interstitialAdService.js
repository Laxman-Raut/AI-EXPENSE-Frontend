import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';

// ─── Real Ad Unit IDs ────────────────────────────────────────────────────────
const REAL_AD_UNIT_GROUP_CREATION = 'ca-app-pub-5049310918821127/1685219311';
const REAL_AD_UNIT_ANALYTICS     = 'ca-app-pub-5049310918821127/4298016774';

// In development (__DEV__), use official Google test ad unit IDs so ads ALWAYS load reliably
// without being blocked by AdMob invalid traffic or lack of ad inventory.
// In release builds, use real live AdMob unit IDs.
export const AD_UNIT_GROUP_CREATION = __DEV__ ? TestIds.INTERSTITIAL : REAL_AD_UNIT_GROUP_CREATION;
export const AD_UNIT_ANALYTICS     = __DEV__ ? TestIds.INTERSTITIAL : REAL_AD_UNIT_ANALYTICS;

// ─── Analytics Ad Frequency Limits ──────────────────────────────────────────
export const ANALYTICS_MAX_DAILY_ADS = 10;
export const ANALYTICS_AD_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between ads

const AD_LOAD_TIMEOUT_MS = 15000; // 15 seconds allows sufficient time for AdMob auction & download
const ANALYTICS_AD_STATE_KEY = '@aet/analytics_interstitial_state';

const getLocalDayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const createAnalyticsAdState = (date = getLocalDayKey()) => ({
  date,
  shownCount: 0,
  lastShownTimestamp: 0,
});

export const getAnalyticsAdState = async () => {
  const today = getLocalDayKey();
  try {
    const storedState = await AsyncStorage.getItem(ANALYTICS_AD_STATE_KEY);
    const parsedState = storedState ? JSON.parse(storedState) : null;
    if (parsedState?.date === today) {
      return {
        date: today,
        shownCount: typeof parsedState.shownCount === 'number' ? parsedState.shownCount : 0,
        lastShownTimestamp: parsedState.lastShownTimestamp || 0,
      };
    }
  } catch (error) {
    console.warn('[Ads] Could not read Analytics ad state:', error);
  }
  return createAnalyticsAdState(today);
};

export const saveAnalyticsAdState = async (state) => {
  try {
    await AsyncStorage.setItem(ANALYTICS_AD_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[Ads] Could not save Analytics ad state:', error);
  }
};

/**
 * Checks whether an ad can be shown on the Analytics screen:
 * 1. Max 10 ads per day
 * 2. 30 minutes cooldown between ads
 */
export const canShowAnalyticsAd = async () => {
  const state = await getAnalyticsAdState();

  // Daily limit check
  if (state.shownCount >= ANALYTICS_MAX_DAILY_ADS) {
    console.log(`[Ads] Analytics daily limit reached (${state.shownCount}/${ANALYTICS_MAX_DAILY_ADS}).`);
    return { canShow: false, reason: 'daily_limit_reached', state };
  }

  // 30 minute cooldown check
  const now = Date.now();
  const timeSinceLastAd = now - (state.lastShownTimestamp || 0);
  if (state.lastShownTimestamp > 0 && timeSinceLastAd < ANALYTICS_AD_COOLDOWN_MS) {
    const remainingMs = ANALYTICS_AD_COOLDOWN_MS - timeSinceLastAd;
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    console.log(`[Ads] Analytics in cooldown. ${remainingMins} min remaining.`);
    return { canShow: false, reason: 'cooldown_active', remainingMins, state };
  }

  return { canShow: true, state };
};

/**
 * Records an ad impression for Analytics: increments shownCount and updates timestamp.
 */
export const recordAnalyticsAdShown = async () => {
  const state = await getAnalyticsAdState();
  state.shownCount = (state.shownCount || 0) + 1;
  state.lastShownTimestamp = Date.now();
  await saveAnalyticsAdState(state);
  console.log(`[Ads] Analytics ad recorded. Today: ${state.shownCount}/${ANALYTICS_MAX_DAILY_ADS}. Next ad available after 30 min.`);
  return state;
};

/**
 * Resets the analytics ad daily counter and cooldown.
 * Use this in development/testing to test ads again immediately.
 */
export const resetAnalyticsAdState = async () => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_AD_STATE_KEY);
    console.log('[Ads] Analytics ad state reset — ads will show again on next eligible click.');
  } catch (error) {
    console.warn('[Ads] Could not reset Analytics ad state:', error);
  }
};

let initializationPromise;

export const initializeAds = () => {
  if (Platform.OS !== 'android') {
    console.log('[Ads] Google Mobile Ads initialization skipped outside Android.');
    return Promise.resolve(false);
  }

  if (!initializationPromise) {
    initializationPromise = mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log('[Ads] Google Mobile Ads initialized successfully:', adapterStatuses);
        preloadAnalyticsAd();
        return true;
      })
      .catch((error) => {
        console.error('[Ads] Google Mobile Ads initialization failed:', error);
        return false;
      });
  }

  return initializationPromise;
};

// ─── Analytics Preload Cache ──────────────────────────────────────────────────
let analyticsInterstitial = null;
let isAnalyticsAdLoaded = false;
let isAnalyticsAdLoading = false;
let analyticsSubscriptions = [];

export const preloadAnalyticsAd = async () => {
  if (Platform.OS !== 'android') return;
  if (isAnalyticsAdLoaded || isAnalyticsAdLoading) return;

  const initialized = await initializeAds();
  if (!initialized) return;

  console.log('[Ads] Preloading Analytics interstitial...');
  isAnalyticsAdLoading = true;

  try {
    if (analyticsInterstitial) {
      analyticsSubscriptions.forEach((unsub) => unsub());
      analyticsSubscriptions = [];
      try {
        analyticsInterstitial.destroy();
      } catch (_) {}
      analyticsInterstitial = null;
    }

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ANALYTICS, {
      requestNonPersonalizedAdsOnly: true,
    });
    analyticsInterstitial = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      isAnalyticsAdLoaded = true;
      isAnalyticsAdLoading = false;
      console.log('[Ads] Analytics interstitial preloaded and ready to show.');
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      isAnalyticsAdLoaded = false;
      isAnalyticsAdLoading = false;
      console.warn(`[Ads] Analytics interstitial preload failed: [${error?.code}] ${error?.message || ''}`);
    });

    analyticsSubscriptions = [unsubLoaded, unsubError];
    ad.load();
  } catch (err) {
    isAnalyticsAdLoading = false;
    isAnalyticsAdLoaded = false;
    console.warn('[Ads] Failed to initiate preload:', err);
  }
};

/**
 * Shows the Analytics interstitial for free users.
 * Uses the preloaded ad if ready, or loads on-demand with a 15s timeout.
 * Resolves true if shown and closed, false on failure/timeout.
 */
export const showAnalyticsAd = async (placement = 'analytics') => {
  if (Platform.OS !== 'android') {
    console.log(`[Ads] ${placement}: interstitial skipped outside Android.`);
    return false;
  }

  if (!(await initializeAds())) {
    console.warn(`[Ads] ${placement}: initialization unavailable; continuing without an ad.`);
    return false;
  }

  return new Promise((resolve) => {
    let isFinished = false;
    let loadTimeout;

    const finish = (wasShown, message, error) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(loadTimeout);

      analyticsSubscriptions.forEach((unsub) => unsub());
      analyticsSubscriptions = [];

      if (analyticsInterstitial) {
        try {
          analyticsInterstitial.destroy();
        } catch (_) {}
        analyticsInterstitial = null;
      }

      isAnalyticsAdLoaded = false;
      isAnalyticsAdLoading = false;

      if (error) {
        console.error(`[Ads] ${message} [Code: ${error?.code}] ${error?.message || ''}`, error);
      } else {
        console.log(`[Ads] ${message}`);
      }

      // Preload next ad in the background for the next eligible trigger
      setTimeout(() => {
        preloadAnalyticsAd();
      }, 1000);

      resolve(wasShown);
    };

    const setupShowListeners = (ad) => {
      analyticsSubscriptions.forEach((unsub) => unsub());
      analyticsSubscriptions = [];

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        finish(true, `${placement}: interstitial closed.`);
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        finish(false, `${placement}: interstitial error during show.`, error);
      });

      analyticsSubscriptions = [unsubClosed, unsubError];

      try {
        console.log(`[Ads] ${placement}: showing interstitial now.`);
        ad.show().catch((err) => {
          finish(false, `${placement}: interstitial failed to show.`, err);
        });
      } catch (err) {
        finish(false, `${placement}: exception showing interstitial.`, err);
      }
    };

    // Case 1: Preloaded ad is ready -> show instantly
    if (analyticsInterstitial && isAnalyticsAdLoaded) {
      console.log(`[Ads] ${placement}: preloaded ad is ready, showing instantly.`);
      setupShowListeners(analyticsInterstitial);
      return;
    }

    // Case 2: Not preloaded or still loading -> wait or initiate load with timeout
    console.log(`[Ads] ${placement}: ad not yet preloaded, loading now...`);
    if (!analyticsInterstitial || (!isAnalyticsAdLoading && !isAnalyticsAdLoaded)) {
      analyticsInterstitial = InterstitialAd.createForAdRequest(AD_UNIT_ANALYTICS, {
        requestNonPersonalizedAdsOnly: true,
      });
      isAnalyticsAdLoading = true;
    }

    const currentAd = analyticsInterstitial;

    const unsubLoaded = currentAd.addAdEventListener(AdEventType.LOADED, () => {
      isAnalyticsAdLoaded = true;
      isAnalyticsAdLoading = false;
      clearTimeout(loadTimeout);
      setupShowListeners(currentAd);
    });

    const unsubError = currentAd.addAdEventListener(AdEventType.ERROR, (error) => {
      finish(false, `${placement}: ad load returned error.`, error);
    });

    analyticsSubscriptions.push(unsubLoaded, unsubError);

    loadTimeout = setTimeout(() => {
      finish(false, `${placement}: interstitial load timed out (${AD_LOAD_TIMEOUT_MS}ms); continuing without ad.`);
    }, AD_LOAD_TIMEOUT_MS);

    if (!isAnalyticsAdLoading) {
      isAnalyticsAdLoading = true;
      try {
        currentAd.load();
      } catch (err) {
        finish(false, `${placement}: interstitial load failed immediately.`, err);
      }
    }
  });
};

/**
 * Helper for group creation interstitial ad.
 */
export const showGroupCreationAd = async (placement = 'group_creation') => {
  return _showAdForUnit(AD_UNIT_GROUP_CREATION, placement);
};

const _showAdForUnit = async (adUnitId, placement) => {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (!(await initializeAds())) {
    return false;
  }

  return new Promise((resolve) => {
    let isFinished = false;
    let showRequested = false;
    let loadTimeout;
    const ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    const subscriptions = [];

    const finish = (wasShown, message, error) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(loadTimeout);
      subscriptions.forEach((unsub) => unsub());
      try {
        ad.destroy();
      } catch (_) {}
      if (error) {
        console.error(`[Ads] ${message} [Code: ${error?.code}] ${error?.message || ''}`, error);
      } else {
        console.log(`[Ads] ${message}`);
      }
      resolve(wasShown);
    };

    subscriptions.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        if (isFinished) return;
        showRequested = true;
        clearTimeout(loadTimeout);
        console.log(`[Ads] ${placement}: interstitial loaded; showing now.`);
        ad.show().catch((error) => finish(false, `${placement}: interstitial failed to show.`, error));
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        finish(true, `${placement}: interstitial closed.`);
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        finish(false, `${placement}: interstitial returned error.`, error);
      })
    );

    loadTimeout = setTimeout(() => {
      if (!showRequested) {
        finish(false, `${placement}: interstitial load timed out; continuing.`);
      }
    }, AD_LOAD_TIMEOUT_MS);

    try {
      ad.load();
    } catch (error) {
      finish(false, `${placement}: interstitial load failed.`, error);
    }
  });
};

/**
 * @deprecated Use showAnalyticsAd or showGroupCreationAd instead.
 */
export const showInterstitialAd = (placement = 'unspecified') =>
  showAnalyticsAd(placement);