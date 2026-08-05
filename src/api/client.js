import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// CONNECTION SETTINGS & ADAPTIVE FALLBACKS
// ─────────────────────────────────────────────────────────────
// Host machine IP address on your local Wi-Fi network (for physical phone)
const LOCAL_IP = '10.35.245.181';
// Android Emulator special loopback IP to host machine
const EMULATOR_IP = '10.0.2.2';

// Render Deployed Backend URL
const RENDER_BASE_URL = 'https://ai-expense-backend-veoz.onrender.com/api';

const getInitialBaseUrl = () => {
  if (process.env.API_URL) {
    const cleanEnvUrl = process.env.API_URL.trim().replace(/\/+$/, '');
    return cleanEnvUrl.endsWith('/api') ? cleanEnvUrl : `${cleanEnvUrl}/api`;
  }
  // Default to machine's active local Wi-Fi IP address (works for physical phones & emulators)
  return `http://${LOCAL_IP}:5000/api`;
};

const BASE_URL = getInitialBaseUrl();
console.log('[API Client] Initial Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
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

// Response interceptor — handle unauthorized responses & errors with adaptive fallbacks
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!originalRequest?.url?.includes('/auth/login')) {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('user');
      }
    }

    // Network Error Fallback Chain:
    // Retry 1: Try EMULATOR_IP (10.0.2.2) or localhost if LOCAL_IP fails
    // Retry 2: Try Deployed Render URL if local server is unreachable
    if (
      (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) &&
      (!originalRequest._retryCount || originalRequest._retryCount < 2)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount === 1) {
        const altIp = Platform.OS === 'android' ? EMULATOR_IP : 'localhost';
        originalRequest.baseURL = `http://${altIp}:5000/api`;
        console.log('[API Client] Retrying network request with alternate IP:', originalRequest.baseURL);
        return apiClient(originalRequest);
      }

      if (originalRequest._retryCount === 2) {
        originalRequest.baseURL = RENDER_BASE_URL;
        console.log('[API Client] Retrying network request with Render Deployed URL:', RENDER_BASE_URL);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
