import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// API BASE URL CONFIGURATION
// ─────────────────────────────────────────────────────────────
// Primary: Render Cloud Backend (always online, 500ms–1.5s response)
// Override: Set process.env.API_URL to point to local dev server when needed
//   e.g. API_URL=http://10.0.2.2:5000 (Android emulator)
//   e.g. API_URL=http://localhost:5000  (iOS simulator)

const RENDER_BASE_URL = 'https://ai-expense-backend-veoz.onrender.com/api';

// Local dev IPs (kept for reference / env override)
const LOCAL_IP = '10.35.245.181';
const LOCALHOST_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const getBaseUrl = () => {
  if (process.env.API_URL) {
    const cleanEnvUrl = process.env.API_URL.trim().replace(/\/+$/, '');
    return cleanEnvUrl.endsWith('/api') ? cleanEnvUrl : `${cleanEnvUrl}/api`;
  }
  // Default to Render Cloud Backend for instant responses
  return RENDER_BASE_URL;
};

const BASE_URL = getBaseUrl();
console.log('[API Client] Active Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
<<<<<<< Updated upstream
  timeout: 30000, // 30s — Render free tier needs up to 30s to wake from sleep
=======
  timeout: 15000,
>>>>>>> Stashed changes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!originalRequest?.url?.includes('/auth/login')) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

