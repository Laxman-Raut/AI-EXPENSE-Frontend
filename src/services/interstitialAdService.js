// Google Ads and AdMob are disabled.
// This module provides safe, no-op stubs to prevent crashes or broken imports.

export const USE_TEST_ADS = false;
export const AD_UNIT_GROUP_CREATION = '';
export const AD_UNIT_ANALYTICS = '';
export const ANALYTICS_MAX_DAILY_ADS = 0;
export const ANALYTICS_AD_COOLDOWN_MS = 0;

export const getAnalyticsAdState = async () => ({
  date: '',
  shownCount: 0,
  lastShownTimestamp: 0,
});

export const saveAnalyticsAdState = async () => {};

export const canShowAnalyticsAd = async () => ({
  canShow: false,
  reason: 'ads_disabled',
});

export const recordAnalyticsAdShown = async () => ({
  date: '',
  shownCount: 0,
  lastShownTimestamp: 0,
});

export const resetAnalyticsAdState = async () => {};

export const initializeAds = () => Promise.resolve(false);

export const preloadAnalyticsAd = async () => {};

export const showAnalyticsAd = async () => false;

export const showGroupCreationAd = async () => false;

export const showInterstitialAd = async () => false;
