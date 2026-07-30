import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// CONNECTION SETTINGS & ADAPTIVE FALLBACKS
// ─────────────────────────────────────────────────────────────
// Host machine IP address on your local Wi-Fi network (for physical phone)
const LOCAL_IP = '10.86.63.181';
// Android Emulator special loopback IP to host machine
const EMULATOR_IP = '10.0.2.2';

// Priority list of host endpoints
const FALLBACK_URLS = [
  process.env.API_URL,
  Platform.OS === 'android' ? `http://${EMULATOR_IP}:5000/api` : null,
  `http://${LOCAL_IP}:5000/api`,
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api',
].filter(Boolean);

let activeUrlIndex = 0;

const getInitialBaseUrl = () => {
  return FALLBACK_URLS[0] || `http://${LOCAL_IP}:5000/api`;
};

const BASE_URL = getInitialBaseUrl();
console.log('[API Client] Initial Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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

// Response interceptor — handle errors & automatic IP fallback
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const isNetworkError =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        error.message?.includes('failed'));

    // Automatically switch IP and retry once if network connection fails
    if (isNetworkError && error.config && !error.config._hasRetriedFallback) {
      activeUrlIndex = (activeUrlIndex + 1) % FALLBACK_URLS.length;
      const nextUrl = FALLBACK_URLS[activeUrlIndex];

      console.warn(
        `[API Client] Network error on ${error.config.baseURL}. Auto-switching to fallback: ${nextUrl}`,
      );

      apiClient.defaults.baseURL = nextUrl;
      const newConfig = {
        ...error.config,
        baseURL: nextUrl,
        _hasRetriedFallback: true,
      };

      try {
        return await apiClient.request(newConfig);
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
