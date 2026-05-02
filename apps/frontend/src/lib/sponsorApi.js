/**
 * sponsorApi.js
 * Axios instance for the sponsor portal.
 * Reads the sponsor access token from useSponsorStore (memory only).
 * On 401 → clears sponsor auth and redirects to /sponsor/login.
 */

import axios from 'axios';

let getStore;
if (typeof window !== 'undefined') {
  getStore = () => require('./useSponsorStore').default.getState();
}

const sponsorApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach sponsor Bearer token
sponsorApi.interceptors.request.use((config) => {
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
