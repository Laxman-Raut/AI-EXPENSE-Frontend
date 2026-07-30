import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import subscriptionService from '../services/subscriptionService';
import { useAlert } from '../context/AlertContext';

export const usePremiumAccess = () => {
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const { plan, status, loading } = useSelector((state: any) => state.subscription);

  const hasPremiumAccess = subscriptionService.isSubscriptionPro({ plan, status });

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
            navigation.navigate('Profile', {
              screen: 'Subscription',
              initial: false,
            });
          },
        },
      ],
      'premium'
    );
  };

  const checkAccessAndNavigate = (targetScreen: string, params: any = {}) => {
    if (hasPremiumAccess) {
      navigation.navigate(targetScreen, params);
      return true;
    } else {
      showPremiumAlert();
      return false;
    }
  };

  const checkAccessAndExecute = (action: () => void) => {
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
    loading,
    plan,
    status,
    showPremiumAlert,
    checkAccessAndNavigate,
    checkAccessAndExecute,
  };
};
