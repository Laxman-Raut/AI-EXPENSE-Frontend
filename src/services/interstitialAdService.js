import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

// ─── Ad Unit IDs ────────────────────────────────────────────────────────────
// NOTE: These are Google's public TEST IDs. Replace with your real AdMob IDs
// before publishing to production.
// Real App ID:        from AdMob dashboard → Apps → your app → App settings
// Real Interstitial:  from AdMob dashboard → Apps → your app → Ad units
const TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';
const AD_LOAD_TIMEOUT_MS = 5000;
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
  firstAttempted: false,
  secondAttempted: false,
  activeAnalyticsMs: 0,
});

export const getAnalyticsAdState = async () => {
  const today = getLocalDayKey();
  try {
    const storedState = await AsyncStorage.getItem(ANALYTICS_AD_STATE_KEY);
    const parsedState = storedState ? JSON.parse(storedState) : null;
    if (parsedState?.date === today) {
      return { ...createAnalyticsAdState(today), ...parsedState };
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
 * Resets the analytics ad daily counter.
 * Use this in development/testing to see ads again after reaching the daily limit.
 */
export const resetAnalyticsAdState = async () => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_AD_STATE_KEY);
    console.log('[Ads] Analytics ad state reset — ads will show again on next visit.');
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
      .then(() => {
        console.log('[Ads] Google Mobile Ads initialized.');
        return true;
      })
      .catch((error) => {
        console.error('[Ads] Google Mobile Ads initialization failed:', error);
        return false;
      });
  }

  return initializationPromise;
};

export const showInterstitialAd = async (placement = 'unspecified') => {
  if (Platform.OS !== 'android') {
    console.log(`[Ads] ${placement}: interstitial skipped outside Android.`);
    return false;
  }

  if (!(await initializeAds())) {
    console.warn(`[Ads] ${placement}: initialization unavailable; continuing without an ad.`);
    return false;
  }

  console.log(`[Ads] ${placement}: requesting test interstitial.`);

  return new Promise((resolve) => {
    let isFinished = false;
    let showRequested = false;
    let loadTimeout;
    const ad = InterstitialAd.createForAdRequest(TEST_INTERSTITIAL_AD_UNIT_ID);
    const subscriptions = [];

    const finish = (wasShown, message, error) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(loadTimeout);
      subscriptions.forEach((unsubscribe) => unsubscribe());
      ad.destroy();
      if (error) {
        console.error(`[Ads] ${message}`, error);
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
        finish(false, `${placement}: interstitial returned an ad error.`, error);
      })
    );

    loadTimeout = setTimeout(() => {
      if (!showRequested) {
        finish(false, `${placement}: interstitial load timed out; continuing without an ad.`);
      }
    }, AD_LOAD_TIMEOUT_MS);

    try {
      ad.load();
    } catch (error) {
      finish(false, `${placement}: interstitial load failed; continuing without an ad.`, error);
    }
  });
};