/**
 * AI Expense Tracker
 * React Native CLI App
 */

import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import FloatingVoiceButton from './src/components/FloatingVoiceButton';
import NotificationService from './src/services/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

await NotificationService.show(
  "🎉 Welcome",
  "This is your first saved notification."
);

function App(): React.JSX.Element {
  useEffect(() => {
    const initNotifications = async () => {
      await NotificationService.initialize();

      await NotificationService.show(
        '🎉 AI Expense Tracker',
        'Notifications are working successfully!'
      );
    };

    initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />

            <View style={{ flex: 1 }}>
              <AppNavigator />
              <FloatingVoiceButton />
            </View>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;