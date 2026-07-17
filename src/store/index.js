import { configureStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import authReducer from './authSlice';
import subscriptionReducer from './subscriptionSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serialization warning checks for React Native
    }),
});

export default store;
