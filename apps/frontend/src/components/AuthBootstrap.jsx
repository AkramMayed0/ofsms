'use client';

/**
 * AuthBootstrap.jsx
 *
 * Runs once on every page load (mounted in the root layout).
 * If the user has a refreshToken httpOnly cookie but no in-memory
 * accessToken (i.e. after a page refresh), it silently calls
 * POST /auth/refresh to restore the session.
 *
 * While the refresh is in-flight, it shows a full-screen loading spinner
 * so the dashboard never flashes empty before the token arrives.
 *
 * Place this as a wrapper in apps/frontend/src/app/layout.jsx
 */

import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';

export default function AuthBootstrap({ children }) {
  // true while we're trying to restore a session from the cookie
  const [bootstrapping, setBootstrapping] = useState(true);

  const { accessToken, user, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // If we already have a token in memory, nothing to do
    if (accessToken) {
      setBootstrapping(false);
      return;
    }

    // If there's no cached user either, there's definitely no session
    if (!user) {
      setBootstrapping(false);
      return;
    }

    // We have a user in sessionStorage but no token in memory.
    // This means the page was refreshed. Try to silently restore
    // the session using the httpOnly refreshToken cookie.
    api
      .post('/auth/refresh')
      .then(({ data }) => {
        // Restore token — keep the user object we already have
        setAuth(data.accessToken, user);
      })
      .catch(() => {
        // Refresh token expired or invalid → force re-login
        clearAuth();
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []); // run once on mount

  if (bootstrapping) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f4f8',
          fontFamily: 'Cairo, Tajawal, sans-serif',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            border: '4px solid #e5e7eb',
            borderTopColor: '#1B5E8C',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
          جارٍ التحقق من الجلسة…
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return children;
}
