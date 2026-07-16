import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

export const navigationRef = createNavigationContainerRef<any>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!NativeModules.ReceiveSharingIntent) {
      console.log('ReceiveSharingIntent native module is not registered in the native binary yet.');
      return;
    }

    const handleReceivedFiles = (files: any[]) => {
      if (files && files.length > 0) {
        const first = files[0];
        const sharedFile = {
          uri: first.filePath || first.contentUri,
          fileName: first.fileName || (first.filePath ? first.filePath.split('/').pop() : 'document.pdf'),
          mimeType: first.mimeType || (first.extension ? `application/${first.extension}` : 'application/pdf'),
          size: first.fileSize || 0,
        };

        if (navigationRef.isReady()) {
          navigationRef.navigate('Today', {
            screen: 'ReceiptScanner',
            params: { sharedFile },
          });
        }

        ReceiveSharingIntent.clearReceivedFiles();
      }
    };

    // Listen for cold starts and background intents
    ReceiveSharingIntent.getReceivedFiles(
      handleReceivedFiles,
      (error: any) => {
        console.log('Share intent error:', error);
      },
      'aiexpensetracker'
    );

    const timeoutId = setTimeout(() => {
      ReceiveSharingIntent.getReceivedFiles(
        handleReceivedFiles,
        (error: any) => {
          console.log('Share intent error:', error);
        },
        'aiexpensetracker'
      );
    }, 800);

    return () => {
      clearTimeout(timeoutId);
      ReceiveSharingIntent.clearReceivedFiles();
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
