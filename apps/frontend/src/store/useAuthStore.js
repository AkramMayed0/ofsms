/**
 * useAuthStore.js — Global auth state via Zustand
 *
 * Stores: accessToken (memory), user (sessionStorage)
 *
 * WHY sessionStorage for user?
 *   - accessToken lives in memory only (security — never persisted)
 *   - But user.role is needed on refresh to know which dashboard to render
 *   - sessionStorage survives F5 refresh but is cleared when the tab closes
 *   - On refresh: user is rehydrated from sessionStorage, then a silent
 *     /auth/refresh call restores the accessToken from the httpOnly cookie
 *
 * Flow on refresh:
 *   1. Zustand rehydrates user.role from sessionStorage
 *   2. AuthBootstrap (in layout) calls /auth/refresh → gets new accessToken
 *   3. setAuth() stores the new token in memory
 *   4. Dashboard renders normally
 */

import { create } from 'zustand';

// ── Safely read user from sessionStorage (handles SSR) ───────────────────────
const readUserFromSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('ofsms_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Safely write user to sessionStorage ──────────────────────────────────────
const writeUserToSession = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem('ofsms_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('ofsms_user');
    }
  } catch {
    // sessionStorage quota exceeded or private mode — fail silently
  }
};

const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: readUserFromSession(), // rehydrate on page load

  // Called after successful login or token refresh
  setAuth: (accessToken, user) => {
    writeUserToSession(user);
    set({ accessToken, user });
  },

  // Called on logout or unrecoverable 401
  clearAuth: () => {
    writeUserToSession(null);
    set({ accessToken: null, user: null });
  },

  // True only when we have a valid in-memory access token
  isAuthenticated: () => !!get().accessToken,

  // True when we have user info (survives refresh before token is restored)
  hasUser: () => !!get().user,
}));

export default useAuthStore;
