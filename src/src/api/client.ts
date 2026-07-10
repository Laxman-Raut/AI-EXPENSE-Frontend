import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isEmulator = () => {
  if (Platform.OS !== 'android') return false;
  
  // Cast Platform.constants to any to access custom vendor fields safely in TypeScript
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

const BASE_URL = USE_LOCAL_BACKEND
  ? (isEmulator() ? 'http://10.0.2.2:5000/api/' : 'http://127.0.0.1:5000/api/')
  : 'https://ai-smart-expense-tracker-age8.onrender.com/api/';

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
