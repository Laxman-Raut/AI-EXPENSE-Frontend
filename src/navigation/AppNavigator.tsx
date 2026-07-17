import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { NativeModules, AppState, AppStateStatus } from 'react-native';
import { useDispatch } from 'react-redux';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import { fetchSubscription } from '../store/subscriptionSlice';

export const navigationRef = createNavigationContainerRef<any>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const dispatch = useDispatch<any>();

  // Centralized Subscription Refresh Logic:
  // 1. Startup & Post-Login refresh
  // 2. Foreground app state transition refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh immediately upon app start or login
    console.log('[Subscription] Centralized Refresh: Fetching subscription details...');
    dispatch(fetchSubscription());

    // Setup listener to refresh when app returns to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[Subscription] Centralized Refresh: App returned to foreground. Fetching subscription...');
        dispatch(fetchSubscription());
      }
    };

    const stateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stateSubscription.remove();
    };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!NativeModules.ReceiveSharingIntent) {
      console.log('[ShareIntent] Native module not registered yet.');
      return;
    }

    const getValidMimeType = (file: any) => {
      let mime = file.mimeType || '';
      if (mime.startsWith('.')) {
        const ext = mime.slice(1).toLowerCase();
        if (ext === 'pdf') return 'application/pdf';
        if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
        if (ext === 'png') return 'image/png';
        if (ext === 'webp') return 'image/webp';
        if (ext === 'doc' || ext === 'docx') return 'application/msword';
        if (ext === 'xls' || ext === 'xlsx') return 'application/vnd.ms-excel';
      }
      if (mime.includes('/')) return mime;

      const ext = (file.extension || file.fileName?.split('.').pop() || '').toLowerCase();
      if (ext === 'pdf') return 'application/pdf';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'png') return 'image/png';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'doc' || ext === 'docx') return 'application/msword';
      if (ext === 'xls' || ext === 'xlsx') return 'application/vnd.ms-excel';

      return 'application/octet-stream';
    };

    const handleReceivedFiles = (files: any[]) => {
      console.log('[ShareIntent] handleReceivedFiles called, count:', files?.length);

      if (!files || files.length === 0) {
        console.log('[ShareIntent] No files in payload — ignoring.');
        return;
      }

      const first = files[0];
      console.log('[ShareIntent] Raw file object:', JSON.stringify(first));

      let uri = first.filePath || first.contentUri || '';
      if (uri && !uri.startsWith('file://') && !uri.startsWith('content://') && uri.startsWith('/')) {
        uri = `file://${uri}`;
      }

      const mimeType = getValidMimeType(first);
      console.log(`[ShareIntent] Resolved URI: ${uri}`);
      console.log(`[ShareIntent] Resolved mimeType: ${mimeType}`);

      if (!uri) {
        console.warn('[ShareIntent] URI is empty — cannot navigate.');
        return;
      }

      const sharedFile = {
        uri,
        fileName: first.fileName || (uri ? uri.split('/').pop() : 'document'),
        mimeType,
        size: first.fileSize || 0,
      };

      console.log('[ShareIntent] Built sharedFile:', JSON.stringify(sharedFile));

      // ─────────────────────────────────────────────────────────────────
      // CRITICAL FIX: Correct nested navigation for React Navigation v7
      //
      // Structure: NavigationContainer > Tab "Today" > DashboardStack > "ReceiptScanner"
      //
      // To navigate to a screen inside a nested stack that's inside a tab,
      // params must be nested: { screen, params: { params: { sharedFile } }, initial: false }
      //
      // `initial: false` ensures ReceiptScanner is PUSHED even when TodayHome
      // is already the active screen (without it the navigate call is a no-op).
      // ─────────────────────────────────────────────────────────────────
      const navigateToScanner = (attempts: number = 0) => {
        if (navigationRef.isReady()) {
          console.log(`[ShareIntent] Navigation ready — navigating to ReceiptScanner (attempt ${attempts + 1})`);
          try {
            navigationRef.navigate('Today', {
              screen: 'ReceiptScanner',
              initial: false,
              params: { sharedFile },
            } as any);
            console.log('[ShareIntent] navigate() called successfully');
            ReceiveSharingIntent.clearReceivedFiles();
          } catch (navErr: any) {
            console.error('[ShareIntent] navigate() threw:', navErr?.message);
          }
        } else if (attempts < 50) {
          // Retry for up to 5 seconds (50 × 100ms) to cover cold start auth delays
          console.log(`[ShareIntent] Nav not ready yet, retrying… (attempt ${attempts + 1}/50)`);
          setTimeout(() => navigateToScanner(attempts + 1), 100);
        } else {
          console.warn('[ShareIntent] Navigation container never became ready after 5s.');
        }
      };

      navigateToScanner();
    };

    console.log('[ShareIntent] Registering getReceivedFiles listener');

    // Cold start: file is available immediately
    ReceiveSharingIntent.getReceivedFiles(
      handleReceivedFiles,
      (error: any) => {
        console.log('[ShareIntent] getReceivedFiles error:', error);
      },
      'aiexpensetracker'
    );

    // Warm start / background wake: slight delay to let the intent propagate
    const timeoutId = setTimeout(() => {
      console.log('[ShareIntent] Delayed getReceivedFiles check (800ms)');
      ReceiveSharingIntent.getReceivedFiles(
        handleReceivedFiles,
        (error: any) => {
          console.log('[ShareIntent] Delayed getReceivedFiles error:', error);
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
