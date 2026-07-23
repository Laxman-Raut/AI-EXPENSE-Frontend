import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// CONNECTION SETTINGS (LOCAL HOST)
// ─────────────────────────────────────────────────────────────
// - Android Emulator connects to host computer via 10.0.2.2:5000
// - iOS Simulator / Web connects via localhost:5000
// ─────────────────────────────────────────────────────────────

// Host machine IP address on your local Wi-Fi network
// (Works for physical Android / iOS phone over Wi-Fi)
const LOCAL_IP = '10.245.170.195';

const getBaseUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  return Platform.OS === 'android'
    ? `http://${LOCAL_IP}:5000/api`
    : 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

console.log('[API Client] Target Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
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

// Response interceptor — handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API SUCCESS] Request to:', response.config.url);
    return response;
  },
  async (error) => {
    console.warn('--- API Request Error ---');
    console.warn('URL:', error.config?.url);
    console.warn('BaseURL:', error.config?.baseURL);
    console.warn('Method:', error.config?.method?.toUpperCase());
    console.warn('Error Message:', error.message);
    console.warn('Response Status:', error.response?.status);
    console.warn('Response Data:', JSON.stringify(error.response?.data));
    console.warn('-------------------------');

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
