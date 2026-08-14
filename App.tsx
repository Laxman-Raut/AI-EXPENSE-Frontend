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
      // 3 minutes tak data fresh maana jaayega
      // Mount pe sirf tab refetch hoga jab data stale ho (> 3 min purana)
      // Yeh 15s se kaafi better hai — baar baar screens ke beech API calls band
      staleTime: 3 * 60 * 1000,
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

    // Render.com Free Tier pe server 15 min mein sleep hota hai
    // Har 9 min mein ping karo taaki server hamesha jaagta rahe
    // Cold start (30-60 sec wait) avoid hoga
    const pingServer = () => apiClient.get('/health').catch(() => {});
    pingServer(); // Turant pehli ping
    const pingInterval = setInterval(pingServer, 9 * 60 * 1000); // Har 9 minute
    return () => clearInterval(pingInterval);
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
