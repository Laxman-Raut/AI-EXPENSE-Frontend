import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { createPaymentOrder, verifyPayment } from '../store/subscriptionSlice';

// ⚠️  DO NOT require('react-native-razorpay') at the top level.
// If the native module is not linked it throws synchronously,
// which crashes the entire JS bundle and causes a black screen.
// Instead we lazily require it inside the function when it's actually needed.

const RAZORPAY_KEY_ID = 'rzp_test_zni49mwUd2H4BI';

export const usePayment = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const user = useSelector((state: any) => state.auth.user);
  const subscription = useSelector((state: any) => state.subscription);

  const startSubscriptionPayment = async (plan: 'pro_monthly' | 'pro_yearly') => {
    try {
      // ─── Step 1: Create a Razorpay order on our backend ───────────────────────
      // POST /api/payment/create-order  { plan }
      // Returns: { order: { id, amount, currency, ... }, payment: { _id, ... } }
      const orderResult = await dispatch((createPaymentOrder as any)(plan)).unwrap();

      if (!orderResult?.order?.id) {
        throw new Error('Failed to retrieve order details from backend. Please try again.');
      }

      const { order } = orderResult;
      const amountFormatted = plan === 'pro_monthly' ? '₹199' : '₹1,999';
      const planNameFormatted = plan === 'pro_monthly' ? 'Pro Monthly Plan' : 'Pro Yearly Plan';

      // ─── Step 2: Open the Razorpay native checkout sheet ──────────────────────
      // The native SDK accepts `order_id` correctly as a body field — this is
      // how Razorpay links the payment to the server-side order we just created.
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: String(order.amount),        // amount in paise (e.g. "19900" for ₹199)
        currency: order.currency || 'INR',
        name: 'AI Expense Tracker',
        description: planNameFormatted,
        order_id: order.id,                  // ✅ Razorpay order ID from our backend
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: '',
        },
        theme: {
          color: '#8A3FFC',
        },
      };

      // ─── Step 3: Await the checkout result ────────────────────────────────────
      // Lazy-require so the native module is only resolved at payment time,
      // not at module load time — prevents black screen if module isn't linked yet.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const RazorpayModule = require('react-native-razorpay');
      const RazorpayCheckout = RazorpayModule.default ?? RazorpayModule;
      const checkoutData = await RazorpayCheckout.open(options);

      // checkoutData contains: { razorpay_payment_id, razorpay_order_id, razorpay_signature }

      // ─── Step 4: Verify payment signature on our backend ──────────────────────
      // POST /api/payment/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
      // The server validates the HMAC-SHA256 signature and upgrades the user's subscription.
      const verifyResult = await dispatch((verifyPayment as any)({
        razorpay_order_id: checkoutData.razorpay_order_id,
        razorpay_payment_id: checkoutData.razorpay_payment_id,
        razorpay_signature: checkoutData.razorpay_signature,
      })).unwrap();

      // ─── Step 5: Navigate to success screen ───────────────────────────────────
      navigation.navigate('PaymentSuccess', {
        planName: planNameFormatted,
        amount: amountFormatted,
        orderId: checkoutData.razorpay_order_id,
        paymentId: checkoutData.razorpay_payment_id,
        endDate: verifyResult?.subscription?.endDate || null,
      });

    } catch (err: any) {
      // Razorpay checkout cancelled: err.code === 0 and err.description === 'Cancelled by user'
      if (err?.code === 0) {
        // User dismissed the checkout sheet — no navigation, no alert
        return;
      }

      // Payment sheet opened but payment was declined/failed
      const isFailed = err?.description && err?.code !== 0;
      if (isFailed) {
        navigation.navigate('PaymentFailed', {
          errorMessage: err.description || 'Payment declined by payment provider.',
          orderId: err?.metadata?.order_id || '',
        });
        return;
      }

      // Network / server / module error
      Alert.alert(
        'Payment Error',
        err?.message || 'Something went wrong while processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    startSubscriptionPayment,
    isLoading: subscription.loading,
    error: subscription.error,
  };
};
