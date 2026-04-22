/**
 * lib/useAuthStore.js — re-export the auth store so api.js can import it
 * without crossing the src/store → src/lib boundary (avoids circular deps).
 */
export { default } from '../store/useAuthStore';
