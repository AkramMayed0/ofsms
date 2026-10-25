/**
 * sponsorApi.js
 * Axios instance for the sponsor portal.
 * Reads the sponsor access token from useSponsorStore (memory only).
 * On 401 → clears sponsor auth and redirects to /sponsor/login.
 */

import axios from 'axios';

let getStore;
if (typeof window !== 'undefined') {
  getStore = () => require('@/store/useSponsorStore').default.getState();
}

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (!process.env.NEXT_PUBLIC_API_URL && host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
};

const sponsorApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach sponsor Bearer token
sponsorApi.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined' && getStore) {
    const token = getStore().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear auth and go to sponsor login
sponsorApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (getStore) getStore().clearSponsorAuth();
      window.location.href = '/sponsor/login';
    }
    return Promise.reject(error);
  }
);

export default sponsorApi;
