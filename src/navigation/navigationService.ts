import { navigationRef } from './AppNavigator';

/**
 * Universally navigates to the 'Subscription' plan selection screen from anywhere in the app.
 * This guarantees that when a user taps "Upgrade" on a Pro feature, they are always
 * directed directly to the Pro Subscription page (RootStack -> Subscription) instead of
 * being incorrectly routed to Profile or getting lost in nested tab navigators.
 */
export const navigateToSubscription = (navigation?: any) => {
  try {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Subscription');
      return;
    }
  } catch (e) {
    console.warn('[Navigation] navigationRef.navigate to Subscription failed:', e);
  }

  if (navigation) {
    try {
      let nav = navigation;
      while (nav.getParent && nav.getParent()) {
        nav = nav.getParent();
      }
      nav.navigate('Subscription');
    } catch (err) {
      console.error('[Navigation] Fallback navigateToSubscription failed:', err);
    }
  }
};
