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

// Render Deployed Backend URL
const RENDER_BASE_URL = 'https://ai-expense-backend-veoz.onrender.com/api';

const getInitialBaseUrl = () => {
  // Ensure process.env.API_URL has /api suffix if defined
  if (process.env.API_URL) {
    const cleanEnvUrl = process.env.API_URL.trim().replace(/\/+$/, '');
    return cleanEnvUrl.endsWith('/api') ? cleanEnvUrl : `${cleanEnvUrl}/api`;
  }
  return RENDER_BASE_URL;
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

// Response interceptor — handle unauthorized responses & errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
