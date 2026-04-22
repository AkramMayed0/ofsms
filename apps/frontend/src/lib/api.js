/**
 * api.js — OFSMS Axios instance
 *
 * Access token is stored in Zustand (memory only — never localStorage).
 * Refresh token lives in httpOnly cookie managed by the backend.
 *
 * On 401: clears auth state and redirects to /login.
 */

import axios from 'axios';

// Lazy import to avoid circular deps / SSR issues
let getStore;
if (typeof window !== 'undefined') {
  // Dynamically import to avoid SSR issues with Zustand
  getStore = () => require('./useAuthStore').default.getState();
}

const api = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL,
  headers:         { 'Content-Type': 'application/json' },
  withCredentials: true, // send httpOnly refreshToken cookie on every request
});

// ── Request interceptor: attach access token from Zustand ────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && getStore) {
    const token = getStore().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: try silent token refresh on 401 ────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      if (originalRequest.url?.includes('/auth/login')) {
        // Don't retry login itself
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.accessToken;

        if (getStore) {
          const store = getStore();
          store.setAuth(newToken, store.user);
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh also failed → clear session and go to login
        if (getStore) getStore().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
