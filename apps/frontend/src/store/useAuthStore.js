/**
 * useAuthStore.js — Global auth state via Zustand
 *
 * Stores: accessToken, user (id, name, role, email)
 * Methods: setAuth, clearAuth, isAuthenticated
 *
 * accessToken is kept in memory only (never localStorage) for security.
 * Refresh token lives in httpOnly cookie managed by the backend.
 */

import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,

  // Called after successful login or token refresh
  setAuth: (accessToken, user) => set({ accessToken, user }),

  // Called on logout or 401
  clearAuth: () => set({ accessToken: null, user: null }),

  // Convenience getter
  isAuthenticated: () => !!get().accessToken,
}));

export default useAuthStore;
