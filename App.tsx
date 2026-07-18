/**
 * AI Expense Tracker
 * React Native CLI App
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/store';

import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/notificationService';
import { initializeTheme, registerThemeListener } from './src/theme/ThemeManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App(): React.JSX.Element {
  const [theme, setTheme] = useState('Dark');

  useEffect(() => {
    // Initialize theme from AsyncStorage or default to Dark
    initializeTheme();

    // Listen for theme change events
    const unsubscribe = registerThemeListener((newTheme: string) => {
      setTheme(newTheme);
    });

    const initNotifications = async () => {
      await NotificationService.initialize();

      await NotificationService.show(
        '🎉 AI Expense Tracker',
        'Notifications are working successfully!'
      );
    };

    initNotifications();

    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AlertProvider>
                <StatusBar
                  barStyle={theme === 'Light' ? 'dark-content' : 'light-content'}
                  backgroundColor="transparent"
                  translucent
                />

                <View style={{ flex: 1 }} key={theme}>
                  <AppNavigator />
                </View>
              </AlertProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

export default App;