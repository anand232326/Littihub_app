import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

/**
 * Resolve API Gateway Base URL (:8000) across platforms:
 * - On Web: uses same-origin '' so requests go to /api/v1/* on the Metro server (:8081),
 *   which proxies them server-to-server to 127.0.0.1:8000 (avoiding browser CORS errors!).
 * - On Android Emulator: maps 10.0.2.2:8000 -> host machine's 127.0.0.1:8000
 * - On iOS Simulator: uses http://localhost:8000
 */
const DEFAULT_BASE_URL =
  Platform.OS === 'web'
    ? ''
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

export const API_DISPLAY_URL =
  API_BASE_URL || 'http://localhost:8000 (via Metro Proxy)';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Inject Bearer JWT token on all Gateway requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Auto-logout on 401 & normalize FastAPI { detail } errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 && useAuthStore.getState().token) {
      await useAuthStore.getState().clearSession();
    }

    const detail = error.response?.data?.detail;
    let message = 'Something went wrong. Please check your connection.';

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail
        .map((err) => `${err.loc?.slice(-1)[0] || 'Field'}: ${err.msg}`)
        .join(', ');
    } else if (error.message) {
      message = error.message;
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.raw = error.response?.data;
    return Promise.reject(normalizedError);
  }
);
