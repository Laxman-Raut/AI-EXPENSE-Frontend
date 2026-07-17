import * as subscriptionApi from '../api/subscription';
import dayjs from 'dayjs';

class SubscriptionService {
  /**
   * Fetches current subscription details from backend
   */
  async fetchSubscriptionDetails() {
    try {
      const response = await subscriptionApi.getSubscription();
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to fetch subscription');
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch subscription');
    }
  }

  /**
   * Upgrades subscription to Pro
   */
  async upgradeUserSubscription() {
    try {
      const response = await subscriptionApi.upgradeSubscription();
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to upgrade subscription');
    } catch (error) {
      throw new Error(error.message || 'Failed to upgrade subscription');
    }
  }

  /**
   * Cancels subscription / reverts to Free
   */
  async cancelUserSubscription() {
    try {
      const response = await subscriptionApi.cancelSubscription();
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to cancel subscription');
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Helper to check if a subscription is Pro and Active
   */
  isSubscriptionPro(subscription) {
    if (!subscription) return false;
    return subscription.plan === 'pro' && subscription.status === 'active';
  }

  /**
   * Formats the renewal/end date for display
   */
  formatRenewalDate(dateString) {
    if (!dateString) return 'Never';
    return dayjs(dateString).format('MMMM DD, YYYY');
  }
}

export default new SubscriptionService();
