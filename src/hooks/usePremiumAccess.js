import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import subscriptionService from '../services/subscriptionService';

export const usePremiumAccess = () => {
  const navigation = useNavigation();
  const { plan, status, loading } = useSelector((state) => state.subscription);

  const hasPremiumAccess = subscriptionService.isSubscriptionPro({ plan, status });

  const showPremiumAlert = () => {
    Alert.alert(
      'Premium Feature',
      'Upgrade to Pro to unlock AI Chat, AI Scanner, Cloud Backup, Voice Transactions and other premium features.',
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Upgrade Now',
          onPress: () => {
            navigation.navigate('Profile', {
              screen: 'Subscription',
              initial: false,
            });
          },
        },
      ]
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
    loading,
    plan,
    status,
    showPremiumAlert,
    checkAccessAndNavigate,
    checkAccessAndExecute,
  };
};
