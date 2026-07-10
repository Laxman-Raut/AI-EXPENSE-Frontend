import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

declare const process: any;

const isEmulator = () => {
  if (Platform.OS !== 'android') return false;
  
  const constants = Platform.constants as any;
  const brand = (constants.Brand || '').toLowerCase();
  const model = (constants.Model || '').toLowerCase();
  const fingerprint = (constants.Fingerprint || '').toLowerCase();
  const hardware = (constants.Hardware || '').toLowerCase();
  
  return (
    brand.startsWith('generic') ||
    brand.startsWith('unknown') ||
    model.includes('google_sdk') ||
    model.includes('emulator') ||
    model.includes('android sdk built for x86') ||
    fingerprint.startsWith('generic') ||
    fingerprint.startsWith('unknown') ||
    hardware.includes('goldfish') ||
    hardware.includes('ranchu') ||
    hardware.includes('vbox')
  );
};

// Toggle this to true if you want to develop with a local backend server instead of the deployed one
const USE_LOCAL_BACKEND = false;

const getBaseUrl = () => {
  if (USE_LOCAL_BACKEND) {
    return Platform.select({
      android: isEmulator() ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api',
      ios: 'http://localhost:5000/api',
      default: 'http://localhost:5000/api',
    }) || 'http://localhost:5000/api';
  }
  let url = process.env.API_URL;
  if (url) {
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = url.endsWith('/') ? `${url}api` : `${url}/api`;
    }
    return url;
  }
  return 'https://ai-smart-expense-tracker-age8.onrender.com/api';
};

const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      // Auth context will handle redirect via state
    }
    return Promise.reject(error);
  },
);

export default apiClient;
