import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────
// CONNECTION SETTINGS
// ─────────────────────────────────────────────────────────────
// Using adb reverse tcp:5000 tcp:5000 — tunnels USB so the phone
// reaches your PC's localhost:5000 directly. No Wi-Fi IP needed.
// ─────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5000/api';
console.log('[API Client] Connecting to:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — allows Render cold-start to wake up
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
