'use client';

/**
 * Login Page — feature/ui-login-page
 *
 * Arabic-first RTL layout. Split-panel design:
 *   - Left  panel: login form (email + password, validation, error state)
 *   - Right panel: branded identity with geometric pattern
 *
 * On success: stores accessToken in Zustand (memory only),
 * then redirects to role-specific dashboard.
 *
 * Roles → routes:
 *   gm         → /dashboard
 *   supervisor → /dashboard
 *   agent      → /dashboard
 *   finance    → /dashboard
 *   (AppShell handles per-role nav items)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/api';

// ── Field validation ──────────────────────────────────────────────────────────
const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = 'البريد الإلكتروني مطلوب';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'البريد الإلكتروني غير صحيح';
  if (!password) errors.password = 'كلمة المرور مطلوبة';
  else if (password.length < 6) errors.password = 'كلمة المرور قصيرة جداً';
  return errors;
};

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const { data } = await api.post('/auth/login', {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Store access token + user in memory (Zustand)
      setAuth(data.accessToken, data.user);

      // Redirect to dashboard — AppShell shows role-specific nav
      router.push('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'حدث خطأ. يرجى المحاولة مجدداً';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root" dir="rtl">

      {/* ── Right panel: brand ─────────────────────────────────────────── */}
      <aside className="brand-panel" aria-hidden="true">
        <BrandPattern />
        <div className="brand-content">
          <div className="brand-logo">
            <OrgIcon />
          </div>
          <h1 className="brand-title">نظام إدارة<br />الأيتام والأسر</h1>
          <p className="brand-subtitle">
            Orphan &amp; Family Sponsorship<br />Management System
          </p>
          <div className="brand-divider" />
          <p className="brand-tagline">شفافية · كفاءة · رعاية</p>
        </div>
      </aside>

      {/* ── Left panel: form ───────────────────────────────────────────── */}
      <main className="form-panel">
        <div className="form-card">

          {/* Mobile-only logo */}
          <div className="mobile-logo">
            <OrgIcon small />
            <span>نظام إدارة الأيتام والأسر</span>
          </div>

          <div className="form-header">
            <h2 className="form-title">تسجيل الدخول</h2>
            <p className="form-hint">أدخل بياناتك للوصول إلى النظام</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="login-form">

            {/* API / server error banner */}
            {apiError && (
              <div className="error-banner" role="alert">
                <span className="error-icon">⚠</span>
                {apiError}
              </div>
            )}

            {/* Email */}
            <div className="field-group">
              <label htmlFor="email" className="field-label">
                البريد الإلكتروني
              </label>
              <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
                <span className="input-icon">✉</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="text-field ltr"
                  disabled={loading}
                  aria-describedby={errors.email ? 'email-err' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p id="email-err" className="field-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <label htmlFor="password" className="field-label">
                كلمة المرور
              </label>
              <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="text-field ltr"
                  disabled={loading}
                  aria-describedby={errors.password ? 'pass-err' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && (
                <p id="pass-err" className="field-error">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  جارٍ تسجيل الدخول…
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>

          </form>

          <p className="form-footer">
            مؤسسة الأرض الطيبة · نظام كفالة الأيتام
          </p>
        </div>
      </main>

      <style jsx>{`

        /* ── Root ────────────────────────────────────────────────────── */
        .login-root {
          display: flex;
          flex-direction: row-reverse; /* RTL: brand right, form left */
          min-height: 100vh;
          background: #f0f4f8;
          font-family: 'Cairo', 'Tajawal', sans-serif;
        }

        /* ── Brand panel ─────────────────────────────────────────────── */
        .brand-panel {
          position: relative;
          width: 42%;
          background: linear-gradient(160deg, #0d3d5c 0%, #1B5E8C 55%, #1a7a6e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .brand-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: #fff;
          padding: 2rem;
        }

        .brand-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .brand-title {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin: 0 0 0.5rem;
          text-shadow: 0 2px 16px rgba(0,0,0,0.18);
        }

        .brand-subtitle {
          font-size: 0.78rem;
          font-weight: 400;
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0 0 1.5rem;
          line-height: 1.8;
        }

        .brand-divider {
          width: 40px;
          height: 2px;
          background: rgba(255,255,255,0.35);
          margin: 0 auto 1.2rem;
          border-radius: 1px;
        }

        .brand-tagline {
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
          letter-spacing: 0.15em;
          margin: 0;
        }

        /* ── Form panel ──────────────────────────────────────────────── */
        .form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          min-height: 100vh;
        }

        .form-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 1.25rem;
          padding: 2.5rem 2rem;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.06),
            0 4px 24px rgba(27,94,140,0.09),
            0 1px 0 rgba(255,255,255,0.8) inset;
          border: 1px solid rgba(27,94,140,0.08);
        }

        /* Mobile logo (hidden on desktop) */
        .mobile-logo {
          display: none;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1B5E8C;
        }

        .form-header {
          margin-bottom: 1.75rem;
          text-align: right;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0d3d5c;
          margin: 0 0 0.3rem;
        }

        .form-hint {
          font-size: 0.85rem;
          color: #6b7a8d;
          margin: 0;
        }

        /* ── Form elements ───────────────────────────────────────────── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .field-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
          padding-right: 0.1rem;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          right: 0.85rem;
          font-size: 0.9rem;
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
          line-height: 1;
        }

        .text-field {
          width: 100%;
          padding: 0.7rem 2.4rem 0.7rem 2.8rem;
          border: 1.5px solid #d1d5db;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-family: 'Cairo', monospace;
          color: #1f2937;
          background: #fafafa;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          outline: none;
          direction: ltr;
          text-align: left;
        }

        .text-field::placeholder {
          color: #c4cdd8;
          direction: ltr;
        }

        .text-field:focus {
          border-color: #1B5E8C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(27,94,140,0.12);
        }

        .input-wrap.has-error .text-field {
          border-color: #dc2626;
          background: #fff8f8;
        }

        .input-wrap.has-error .text-field:focus {
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
        }

        .toggle-pass {
          position: absolute;
          left: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: #9ca3af;
          padding: 0.2rem;
          line-height: 1;
          transition: color 0.15s;
        }

        .toggle-pass:hover { color: #1B5E8C; }

        .field-error {
          font-size: 0.78rem;
          color: #dc2626;
          margin: 0;
          padding-right: 0.2rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .field-error::before {
          content: '•';
          font-size: 1rem;
          line-height: 1;
        }

        /* ── Error banner ────────────────────────────────────────────── */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.6rem;
          padding: 0.65rem 0.85rem;
          font-size: 0.83rem;
          color: #b91c1c;
          font-weight: 500;
          animation: slideDown 0.2s ease;
        }

        .error-icon {
          font-style: normal;
          flex-shrink: 0;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Submit button ───────────────────────────────────────────── */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, #1B5E8C 0%, #134569 100%);
          color: #fff;
          font-family: 'Cairo', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          margin-top: 0.4rem;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(27,94,140,0.28), 0 1px 0 rgba(255,255,255,0.1) inset;
          transition: transform 0.12s, box-shadow 0.12s, background 0.15s;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2E7EB8 0%, #1B5E8C 100%);
          box-shadow: 0 4px 16px rgba(27,94,140,0.35);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 1px 4px rgba(27,94,140,0.2);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ── Spinner ─────────────────────────────────────────────────── */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Footer ──────────────────────────────────────────────────── */
        .form-footer {
          text-align: center;
          font-size: 0.72rem;
          color: #9ca3af;
          margin: 1.5rem 0 0;
          letter-spacing: 0.03em;
        }

        /* ── Responsive ──────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .login-root {
            flex-direction: column;
          }

          .brand-panel {
            width: 100%;
            min-height: 180px;
            padding: 2rem 1rem;
          }

          .brand-title  { font-size: 1.3rem; }
          .brand-subtitle { display: none; }

          .form-panel {
            padding: 1.5rem 1rem;
            align-items: flex-start;
          }

          .mobile-logo {
            display: flex;
          }

          .form-card {
            padding: 2rem 1.25rem;
            box-shadow: none;
            border: none;
            background: transparent;
          }
        }

      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** SVG geometric pattern overlay for the brand panel */
function BrandPattern() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.07,
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          {/* Hexagon-ish grid */}
          <polygon
            points="30,2 58,17 58,43 30,58 2,43 2,17"
            fill="none"
            stroke="white"
            strokeWidth="1"
          />
          <circle cx="30" cy="30" r="6" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        {/* Large decorative circles */}
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)" />
      {/* Large accent circles */}
      <circle cx="20%" cy="15%" r="120" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
      <circle cx="80%" cy="85%" r="180" fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <circle cx="75%" cy="20%" r="60" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/** Organisation icon / shield emblem */
function OrgIcon({ small }) {
  const size = small ? 28 : 64;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 4L8 16v16c0 13.3 10.2 25.7 24 29 13.8-3.3 24-15.7 24-29V16L32 4z"
        fill={small ? '#1B5E8C' : 'rgba(255,255,255,0.15)'}
        stroke={small ? '#1B5E8C' : 'rgba(255,255,255,0.8)'}
        strokeWidth="2"
      />
      <path
        d="M24 32l5 5 11-11"
        stroke={small ? '#fff' : 'rgba(255,255,255,0.9)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
