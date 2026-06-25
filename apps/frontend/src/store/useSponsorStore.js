/**
 * useSponsorStore.js
 * Zustand store for sponsor portal auth — completely separate from the
 * main useAuthStore used by internal staff.
 *
 * Access token stored in memory only (never localStorage).
 * Sponsor logs in via portal_token + password.
 */

import { create } from 'zustand';

const useSponsorStore = create((set, get) => ({
  accessToken: null,
  sponsor: null,

  setSponsorAuth: (accessToken, sponsor) => set({ accessToken, sponsor }),
  clearSponsorAuth: () => set({ accessToken: null, sponsor: null }),
  isAuthenticated: () => !!get().accessToken,
}));

export default useSponsorStore;
