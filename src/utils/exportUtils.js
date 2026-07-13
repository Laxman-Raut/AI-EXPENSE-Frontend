import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

// Get the server root URL from the axios client base URL
// apiClient.defaults.baseURL is e.g. "http://10.0.2.2:5000/api"
// We strip "/api" to get "http://10.0.2.2:5000"
const getServerBaseUrl = () => {
  const base = apiClient.defaults.baseURL || 'http://10.0.2.2:5000/api';
  return base.replace(/\/api\/?$/, '');
};

const openExportURL = async (format) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated. Please log in again.');

  const baseUrl = getServerBaseUrl();
  const url = `${baseUrl}/api/export?format=${format}&token=${encodeURIComponent(token)}`;

  try {
    await Linking.openURL(url);
  } catch (err) {
    throw new Error(
      `Could not open download URL.\n\nMake sure your backend server is running and reachable at:\n${baseUrl}`
    );
  }
};

// ──────────────── EXCEL EXPORT ────────────────
export const exportToExcel = async () => {
  await openExportURL('xlsx');
  return { success: true };
};

// ──────────────── PDF EXPORT ────────────────
export const exportToPDF = async () => {
  await openExportURL('pdf');
  return { success: true };
};
