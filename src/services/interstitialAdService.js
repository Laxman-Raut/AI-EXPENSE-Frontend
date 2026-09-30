import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';

// ─── Real Ad Unit IDs ────────────────────────────────────────────────────────
const AD_UNIT_GROUP_CREATION = 'ca-app-pub-5049310918821127/1685219311';
const AD_UNIT_ANALYTICS     = 'ca-app-pub-5049310918821127/4298016774';

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

/**
 * Internal helper — loads and shows a single interstitial for the given ad unit ID.
 * Resolves true if the ad was shown and closed, false on any failure.
 * Always resolves (never rejects) so callers can safely continue on failure.
 */
const _showInterstitial = async (adUnitId, placement) => {
  if (Platform.OS !== 'android') {
    console.log(`[Ads] ${placement}: interstitial skipped outside Android.`);
    return false;
  }

  if (!(await initializeAds())) {
    console.warn(`[Ads] ${placement}: initialization unavailable; continuing without an ad.`);
    return false;
  }

  console.log(`[Ads] ${placement}: requesting interstitial.`);

  return new Promise((resolve) => {
    let isFinished = false;
    let showRequested = false;
    let loadTimeout;
    const ad = InterstitialAd.createForAdRequest(adUnitId);
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

/**
 * Shows the Group Creation interstitial for FREE users only.
 * Call this after a group is successfully created, before navigating away.
 * Premium users must never be passed here — check isPremium before calling.
 */
export const showGroupCreationAd = (placement = 'group_creation') =>
  _showInterstitial(AD_UNIT_GROUP_CREATION, placement);

/**
 * Shows the Analytics interstitial for FREE users only.
 * Premium users must never be passed here — check isPremium before calling.
 */
export const showAnalyticsAd = (placement = 'analytics') =>
  _showInterstitial(AD_UNIT_ANALYTICS, placement);

/**
 * @deprecated Use showGroupCreationAd or showAnalyticsAd instead.
 * Kept for any legacy call-sites that still reference showInterstitialAd.
 * Routes to the analytics ad unit by default.
 */
export const showInterstitialAd = (placement = 'unspecified') =>
  _showInterstitial(AD_UNIT_ANALYTICS, placement);