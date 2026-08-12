import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { createTables } from './src/database/schema';
import AppNavigator from './src/navigation/AppNavigator';
import './src/config/googleSignin';
import apiClient from './src/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15 * 1000, // 15 seconds stale time for instant 0ms screen transitions
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    try {
      createTables();
    } catch (error) {
      console.error('Error initializing SQLite tables:', error);
    }

    // Silent server warm-up ping (pre-warms Render backend if sleeping)
    apiClient.get('/health').catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <AlertProvider>
                <AppNavigator />
              </AlertProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
