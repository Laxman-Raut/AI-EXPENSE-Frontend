import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { NativeModules, NativeEventEmitter } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

const { ShareIntentModule } = NativeModules;
const shareIntentEmitter = new NativeEventEmitter(ShareIntentModule);

export const navigationRef = createNavigationContainerRef<any>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const navigateToImport = (uri: string) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Today', {
          screen: 'ReceiptImport',
          params: { sharedImageUri: uri },
        });
      }
    };

    // 1. Check for initial share on cold start
    const checkInitialShare = async () => {
      try {
        const sharedUri = await ShareIntentModule.getInitialShare();
        if (sharedUri && isMounted) {
          navigateToImport(sharedUri);
        }
      } catch (error) {
        console.error('Failed to get initial share:', error);
      }
    };

    // Wait a brief moment for the navigation stacks to fully mount
    const timeoutId = setTimeout(checkInitialShare, 800);

    // 2. Listen for hot share events (when app is already running)
    const subscription = shareIntentEmitter.addListener('onShareIntent', (sharedUri: string) => {
      navigateToImport(sharedUri);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
