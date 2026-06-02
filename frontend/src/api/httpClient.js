import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/storage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry || originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ||= axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        setTokens(response.data);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });

    const accessToken = await refreshPromise;
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return httpClient(originalRequest);
  },
);

export { API_BASE_URL };
