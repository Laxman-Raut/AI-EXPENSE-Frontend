import { navigationRef } from './AppNavigator';

// Sets of screens belonging to nested tab stacks
const TAB_SCREENS: Record<string, { tab: string; defaultScreen?: string }> = {
  // Today Tab
  Today: { tab: 'Today', defaultScreen: 'TodayHome' },
  TodayHome: { tab: 'Today', defaultScreen: 'TodayHome' },

  // Analytics Tab
  Analytics: { tab: 'Analytics', defaultScreen: 'AnalyticsHome' },
  AnalyticsHome: { tab: 'Analytics', defaultScreen: 'AnalyticsHome' },
  AIInsights: { tab: 'Analytics', defaultScreen: 'AIInsights' },

  // Friends Tab
  Friends: { tab: 'Friends', defaultScreen: 'FriendsHome' },
  FriendsHome: { tab: 'Friends', defaultScreen: 'FriendsHome' },
  UserSearch: { tab: 'Friends', defaultScreen: 'UserSearch' },
  GroupsList: { tab: 'Friends', defaultScreen: 'GroupsList' },
  GroupDetails: { tab: 'Friends', defaultScreen: 'GroupDetails' },
  CreateEditGroup: { tab: 'Friends', defaultScreen: 'CreateEditGroup' },
  CreateSplitRequest: { tab: 'Friends', defaultScreen: 'CreateSplitRequest' },
  SplitRequestDetail: { tab: 'Friends', defaultScreen: 'SplitRequestDetail' },

  // Wallet Tab
  Wallet: { tab: 'Wallet', defaultScreen: 'TransactionsList' },
  TransactionsList: { tab: 'Wallet', defaultScreen: 'TransactionsList' },

  // Profile Tab
  Profile: { tab: 'Profile', defaultScreen: 'ProfileHome' },
  ProfileHome: { tab: 'Profile', defaultScreen: 'ProfileHome' },
  RecurringTransactions: { tab: 'Profile', defaultScreen: 'RecurringTransactions' },
  AddEditRecurring: { tab: 'Profile', defaultScreen: 'AddEditRecurring' },
};

/**
 * Universally navigates to any screen in the app with proper nested navigator routing.
 * Can be called from any screen, component, or background service.
 */
export const navigateUniversal = (screenName: string, params?: any, localNavigation?: any) => {
  console.log(`[NavigationService] Universal navigate requested: ${screenName}`, params);

  // Determine target navigation parameters
  let targetTab = null;
  let targetScreen = screenName;
  let targetParams = params;

  if (TAB_SCREENS[screenName]) {
    const config = TAB_SCREENS[screenName];
    targetTab = config.tab;

    // If caller passed "Friends", target tab is "Friends" and nested screen is "FriendsHome"
    if (screenName === config.tab) {
      if (params && params.screen) {
        targetScreen = params.screen;
        targetParams = params.params;
      } else {
        targetScreen = config.defaultScreen || screenName;
        targetParams = params;
      }
    } else {
      targetScreen = screenName;
      targetParams = params;
    }
  }

  // 1. First attempt: Global navigationRef
  if (navigationRef.isReady()) {
    try {
      if (targetTab) {
        navigationRef.navigate('MainTabs', {
          screen: targetTab,
          params: targetParams ? { screen: targetScreen, params: targetParams } : { screen: targetScreen },
        });
        return true;
      } else {
        // Direct RootStack screen (e.g. Budget, AddTransaction, Subscription, Notifications, etc.)
        if (targetParams) {
          navigationRef.navigate(screenName, targetParams);
        } else {
          navigationRef.navigate(screenName);
        }
        return true;
      }
    } catch (refErr) {
      console.warn('[NavigationService] navigationRef failed, trying local fallback:', refErr);
    }
  }

  // 2. Second attempt: Local navigation object
  if (localNavigation) {
    try {
      let nav = localNavigation;
      while (nav.getParent && nav.getParent()) {
        nav = nav.getParent();
      }

      if (targetTab) {
        nav.navigate('MainTabs', {
          screen: targetTab,
          params: targetParams ? { screen: targetScreen, params: targetParams } : { screen: targetScreen },
        });
        return true;
      } else {
        if (targetParams) {
          nav.navigate(screenName, targetParams);
        } else {
          nav.navigate(screenName);
        }
        return true;
      }
    } catch (localErr) {
      console.error('[NavigationService] Local navigation fallback failed:', localErr);
    }
  }

  return false;
};

/**
 * Universally navigates to the 'Subscription' plan selection screen from anywhere in the app.
 */
export const navigateToSubscription = (navigation?: any) => {
  return navigateUniversal('Subscription', undefined, navigation);
};
