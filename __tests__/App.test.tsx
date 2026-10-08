/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('../src/navigation/AppNavigator', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View, { testID: 'app-navigator' });
});

jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/context/AlertContext', () => ({
  AlertProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/database', () => ({
  createTables: jest.fn(),
  runMigration: jest.fn(),
}));

jest.mock('../src/config/googleSignin', () => ({}));

jest.mock('../src/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(() => ({})),
    subscribe: jest.fn(),
  },
}));

jest.mock('../src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../src/services/interstitialAdService', () => ({
  initializeAds: jest.fn(),
}));

import App from '../App';

test('renders correctly', async () => {
  let component: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(async () => {
    component?.unmount();
  });
});
