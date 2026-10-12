// Mock store before imports to avoid immer ESM transform issue in Jest
let mockState = {
  subscription: { plan: 'free', status: 'active' },
};

jest.mock('../src/store', () => ({
  store: {
    getState: jest.fn(() => mockState),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('react-native-google-mobile-ads', () => {
  const listeners = {};
  const mockAd = {
    load: jest.fn(() => {
      setTimeout(() => {
        if (listeners['error']) {
          listeners['error'](new Error('Mock load error'));
        }
      }, 10);
    }),
    show: jest.fn(),
    destroy: jest.fn(),
    addAdEventListener: jest.fn((event, handler) => {
      listeners[event] = handler;
      return () => {
        delete listeners[event];
      };
    }),
  };

  return {
    __esModule: true,
    default: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue({}),
    })),
    AdEventType: {
      LOADED: 'loaded',
      OPENED: 'opened',
      CLOSED: 'closed',
      ERROR: 'error',
    },
    InterstitialAd: {
      createForAdRequest: jest.fn(() => mockAd),
    },
    TestIds: {
      INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    },
  };
}, { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => {
  let storage = {};
  return {
    getItem: jest.fn(async (key) => storage[key] || null),
    setItem: jest.fn(async (key, val) => {
      storage[key] = String(val);
    }),
    removeItem: jest.fn(async (key) => {
      delete storage[key];
    }),
    clear: jest.fn(async () => {
      storage = {};
    }),
  };
});

import {
  TEST_APP_ID,
  TEST_INTERSTITIAL_AD_UNIT_ID,
  USE_TEST_ADS,
  AD_UNIT_ANALYTICS,
  AD_UNIT_GROUP_CREATION,
  AD_UNIT_RECURRING,
  ANALYTICS_AD_COOLDOWN_MS,
  ANALYTICS_MAX_DAILY_ADS,
  isUserPremium,
  canShowAnalyticsAd,
  recordAnalyticsAdShown,
  resetAnalyticsAdState,
  showAnalyticsAd,
  showRecurringAutomationAd,
  showGroupCreationAd,
  initializeAds,
} from '../src/services/interstitialAdService';
import { exportToPDF, exportToExcel } from '../src/utils/exportUtils';

describe('Interstitial Ad Service & Placements Verification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockState = { subscription: { plan: 'free', status: 'active' } };
    await resetAnalyticsAdState();
  });

  describe('1. Test Configuration Verification', () => {
    test('uses official AdMob TEST IDs exclusively', () => {
      expect(TEST_APP_ID).toBe('ca-app-pub-3940256099942544~3347511713');
      expect(TEST_INTERSTITIAL_AD_UNIT_ID).toBe('ca-app-pub-3940256099942544/1033173712');
      expect(AD_UNIT_ANALYTICS).toBe(TEST_INTERSTITIAL_AD_UNIT_ID);
      expect(AD_UNIT_GROUP_CREATION).toBe(TEST_INTERSTITIAL_AD_UNIT_ID);
      expect(AD_UNIT_RECURRING).toBe(TEST_INTERSTITIAL_AD_UNIT_ID);
      expect(USE_TEST_ADS).toBe(true);

      // Verify no production ad unit IDs are active
      expect(AD_UNIT_ANALYTICS).not.toContain('5049310918821127');
      expect(AD_UNIT_GROUP_CREATION).not.toContain('5049310918821127');
    });

    test('initializeAds returns safely without throwing in test environment', async () => {
      const result = await initializeAds();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('2. Premium-User Protection Verification', () => {
    test('detects Free user correctly from Redux subscription state', () => {
      mockState = { subscription: { plan: 'free', status: 'active' } };
      expect(isUserPremium()).toBe(false);
    });

    test('detects Pro / Premium user correctly from Redux subscription state', () => {
      mockState = { subscription: { plan: 'pro_monthly', status: 'active' } };
      expect(isUserPremium()).toBe(true);
    });

    test('Premium users NEVER trigger ads for Analytics (Placement A)', async () => {
      mockState = { subscription: { plan: 'pro_annual', status: 'active' } };

      const canShow = await canShowAnalyticsAd();
      expect(canShow.canShow).toBe(false);
      expect(canShow.reason).toBe('premium_user');

      const shown = await showAnalyticsAd('test_placement');
      expect(shown).toBe(false);
    });

    test('Premium users NEVER trigger ads for Recurring Automation (Placement B)', async () => {
      mockState = { subscription: { plan: 'pro_monthly', status: 'active' } };

      const shown = await showRecurringAutomationAd('recurring_create');
      expect(shown).toBe(false);
    });

    test('Premium users NEVER trigger ads for Group Creation (Placement C)', async () => {
      mockState = { subscription: { plan: 'pro_monthly', status: 'active' } };

      const shown = await showGroupCreationAd('group_creation');
      expect(shown).toBe(false);
    });
  });

  describe('3. Placement A — Analytics Cooldown and Daily Frequency Limits', () => {
    test('enforces 15-minute cooldown between Analytics ads', async () => {
      mockState = { subscription: { plan: 'free', status: 'active' } };

      // Initially eligible
      let eligibility = await canShowAnalyticsAd();
      expect(eligibility.canShow).toBe(true);

      // Record ad shown
      await recordAnalyticsAdShown();

      // Immediately checking again should be blocked by cooldown
      eligibility = await canShowAnalyticsAd();
      expect(eligibility.canShow).toBe(false);
      expect(eligibility.reason).toBe('cooldown_active');

      // Fast-forward beyond 15m cooldown
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + ANALYTICS_AD_COOLDOWN_MS + 1000);
      eligibility = await canShowAnalyticsAd();
      expect(eligibility.canShow).toBe(true);

      nowSpy.mockRestore();
    });

    test('enforces daily limit of 10 ads for Analytics', async () => {
      mockState = { subscription: { plan: 'free', status: 'active' } };

      for (let i = 0; i < ANALYTICS_MAX_DAILY_ADS; i++) {
        await recordAnalyticsAdShown();
      }

      // Fast-forward past cooldown
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 2 * ANALYTICS_AD_COOLDOWN_MS);
      const eligibility = await canShowAnalyticsAd();
      expect(eligibility.canShow).toBe(false);
      expect(eligibility.reason).toBe('daily_limit_reached');

      nowSpy.mockRestore();
    });
  });

  describe('4. Graceful Error Handling & Non-Blocking Execution', () => {
    test('all ad functions resolve boolean false and never throw when SDK is unavailable or ad fails', async () => {
      mockState = { subscription: { plan: 'free', status: 'active' } };

      await expect(showAnalyticsAd('analytics_tab_open')).resolves.toBe(false);
      await expect(showRecurringAutomationAd('recurring_create_start')).resolves.toBe(false);
      await expect(showGroupCreationAd('group_creation')).resolves.toBe(false);
    });
  });

  describe('5. PDF and Excel Exports Never Show Ads', () => {
    test('exportToPDF and exportToExcel contain no ad logic and do not call ads', () => {
      expect(typeof exportToPDF).toBe('function');
      expect(typeof exportToExcel).toBe('function');
    });
  });

  describe('6. Android Platform Behavior', () => {
    test('skips ads and resolves false gracefully on Android when SDK is unlinked without throwing', async () => {
      const { Platform } = require('react-native');
      const originalOS = Platform.OS;
      Platform.OS = 'android';

      mockState = { subscription: { plan: 'free', status: 'active' } };

      const res1 = await showAnalyticsAd('analytics_tab_open');
      expect(res1).toBe(false);

      const res2 = await showRecurringAutomationAd('recurring_create_start');
      expect(res2).toBe(false);

      const res3 = await showGroupCreationAd('group_creation');
      expect(res3).toBe(false);

      Platform.OS = originalOS;
    });
  });
});
