import * as subscriptionApi from '../api/subscription';
import * as paymentApi from '../api/payment';
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
   * Creates a payment order in the backend for the selected plan
   */
  async createPaymentOrder(plan, couponCode = null) {
    try {
      const response = await paymentApi.createPaymentOrder(plan, couponCode);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to create payment order');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to create payment order';
      throw new Error(msg);
    }
  }

  /**
   * Validates a coupon code for a specific plan
   */
  async validateCoupon(code, planSlug) {
    try {
      const response = await paymentApi.validateCoupon(code, planSlug);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Invalid coupon code');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Invalid coupon code';
      throw new Error(msg);
    }
  }

  /**
   * Verifies Razorpay payment signature in the backend
   */
  async verifyPayment(payload) {
    try {
      const response = await paymentApi.verifyPayment(payload);
      if (response && response.success) {
        return response.data;
      }
      throw new Error(response?.message || 'Failed to verify payment');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to verify payment';
      throw new Error(msg);
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
    const isFreePlan = !subscription.plan || subscription.plan === 'free';
    return !isFreePlan && subscription.status === 'active';
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
