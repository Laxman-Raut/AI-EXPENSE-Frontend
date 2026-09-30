import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import subscriptionService from '../services/subscriptionService';
import { fetchSubscription } from '../store/subscriptionSlice';
import { useAlert } from '../context/AlertContext';
import { navigateToSubscription } from '../navigation/navigationService';

export const usePremiumAccess = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const { plan, status, loading, hasFetched } = useSelector((state) => state.subscription);

  const hasPremiumAccess = subscriptionService.isSubscriptionPro({ plan, status });

  const resolvePremiumAccess = async () => {
    if (hasPremiumAccess) return true;
    if (hasFetched) return false;

    try {
      const subscription = await dispatch(fetchSubscription()).unwrap();
      return subscriptionService.isSubscriptionPro(subscription);
    } catch (error) {
      console.warn('[Subscription] Could not verify plan before protected action:', error);
      return null;
    }
  };

  const showPremiumAlert = () => {
    showAlert(
      'Premium Feature 🚀',
      'Upgrade your plan to unlock AI Chat, AI Scanner, Cloud Backup, Voice Transactions and Group Split Bill features.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Upgrade Plan ⚡',
          onPress: () => {
            navigateToSubscription(navigation);
          },
        },
      ],
      'premium'
    );
  };

  const checkAccessAndNavigate = (targetScreen, params = {}) => {
    if (hasPremiumAccess) {
      navigation.navigate(targetScreen, params);
      return true;
    } else {
      showPremiumAlert();
      return false;
    }
  };

  const checkAccessAndExecute = (action) => {
    if (hasPremiumAccess) {
      action();
      return true;
    } else {
      showPremiumAlert();
      return false;
    }
  };

  return {
    hasPremiumAccess,
    resolvePremiumAccess,
    loading,
    hasFetched,
    plan,
    status,
    showPremiumAlert,
    checkAccessAndNavigate,
    checkAccessAndExecute,
  };
};
