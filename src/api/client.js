import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// LOCALHOST & LOCAL NETWORK CONNECTION SETTINGS
// ─────────────────────────────────────────────────────────────
// Host machine IP address on your local Wi-Fi network (for physical phone)
const LOCAL_IP = '10.35.245.181';
// Android Emulator loopback IP to host machine (10.0.2.2) or localhost for iOS/web
const LOCALHOST_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const RENDER_BASE_URL = 'https://ai-expense-backend-veoz.onrender.com/api';

const getInitialBaseUrl = () => {
  if (process.env.API_URL) {
    const cleanEnvUrl = process.env.API_URL.trim().replace(/\/+$/, '');
    return cleanEnvUrl.endsWith('/api') ? cleanEnvUrl : `${cleanEnvUrl}/api`;
  }
  // Point to local development backend server
  return `http://${LOCALHOST_IP}:5000/api`;
};

const BASE_URL = getInitialBaseUrl();
console.log('[API Client] Active Development Base URL:', BASE_URL);

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

// Response interceptor — handle token expiry & network retry
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

    // Adaptive Network Fallback Chain:
    // Retry 1: Try LOCAL_IP (Wi-Fi network IP) if 10.0.2.2/localhost fails
    // Retry 2: Try Render Deployed Backend if local server is offline
    const isGetRequest = originalRequest?.method?.toLowerCase() === 'get';
    const isTimeout = error.code === 'ECONNABORTED';

    if (
      originalRequest &&
      (!isTimeout || isGetRequest) &&
      (isTimeout || error.message === 'Network Error' || !error.response) &&
      (!originalRequest._retryCount || originalRequest._retryCount < 2)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount === 1) {
        originalRequest.baseURL = `http://${LOCAL_IP}:5000/api`;
        console.log('[API Client] Retrying network request on local network IP:', originalRequest.baseURL);
        return apiClient(originalRequest);
      }

      if (originalRequest._retryCount === 2) {
        originalRequest.baseURL = RENDER_BASE_URL;
        console.log('[API Client] Local server unreachable. Retrying with Render Backend:', RENDER_BASE_URL);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
