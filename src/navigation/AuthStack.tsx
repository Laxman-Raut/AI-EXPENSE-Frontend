import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

const Stack = createNativeStackNavigator();

const AuthStack: React.FC = () => {
  const [initialRouteName, setInitialRouteName] = useState<'Onboarding' | 'Login' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveInitialRoute = async () => {
      try {
        const onboardingSeen = await AsyncStorage.getItem('onboarding_seen');
        if (!cancelled) {
          setInitialRouteName(onboardingSeen === 'true' ? 'Login' : 'Onboarding');
        }
      } catch {
        // Showing onboarding is the safe fallback when storage is unavailable.
        if (!cancelled) setInitialRouteName('Onboarding');
      }
    };

    resolveInitialRoute();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!initialRouteName) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
