'use client';

/**
 * Route: /sponsor/login
 * API:   POST /api/sponsor/login  { portalToken, password }
 *
 * Sponsors access via a unique URL:
 *   https://ofsms.org/sponsor/login?token=<portal_token>
 * The token is pre-filled from the query param.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useSponsorStore from '../useSponsorStore';

export default function SponsorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSponsorAuth = useSponsorStore((s) => s.setSponsorAuth);

  const [portalToken, setPortalToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill token from URL ?token=xxx
  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setPortalToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portalToken.trim() || !password) {
      setError('يرجى إدخال رمز البوابة وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/sponsor/login`,
        { portalToken: portalToken.trim(), password }
      );
      setSponsorAuth(data.accessToken, data.sponsor);
      router.push('/sponsor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'رمز البوابة أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="root" dir="rtl">
      {/* Decorative side */}
      <aside className="brand">
        <div className="brand-inner">
          <img
            src="/ikram-logo.png"
            alt="مؤسسة إكرام النعمة الخيرية"
            className="brand-logo"
          />
        </div>
      </aside>

      {/* Login form */}
      <main className="form-side">
        <div className="form-card">
          <div className="form-header">
            <div className="form-icon"><ShieldIcon small /></div>
            <h2 className="form-title">تسجيل دخول الكافل</h2>
            <p className="form-hint">أدخل بياناتك للاطلاع على أيتامك ومتابعة تقاريرهم</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="err-banner">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="field">
              <label className="label">رمز البوابة</label>
              <input
                className="inp ltr"
                type="text"
                placeholder="أدخل رمز البوابة الخاص بك"
                value={portalToken}
                onChange={e => setPortalToken(e.target.value)}
                disabled={loading}
                dir="ltr"
              />
              <p className="field-hint">الرمز مُرسَل إليك من قِبَل المؤسسة أو موجود في الرابط</p>
            </div>

            <div className="field">
              <label className="label">كلمة المرور</label>
              <div className="inp-wrap">
                <input
                  className="inp ltr"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? <><span className="spin" />جارٍ تسجيل الدخول…</>
                : 'دخول البوابة ←'
              }
            </button>
          </form>

          <p className="footer-note">
            إذا لم يكن لديك رمز بوابة، تواصل مع مؤسسة الأرض الطيبة
          </p>
        </div>
      </main>

      <style jsx>{`
        .root { display:flex; flex-direction:row-reverse; min-height:100vh; font-family:'Cairo','Tajawal',sans-serif; background:#f5f7fa; }

        /* Brand side */
        .brand { position:relative; width:42%; background:linear-gradient(160deg,#1a4a2e 0%,#2d7a4a 55%,#1B5E8C 100%); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
        .brand-inner { position:relative; z-index:2; text-align:center; padding:2.5rem 2rem; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .brand-logo { max-width:300px; width:80%; height:auto; object-fit:contain; background:#fff; border-radius:1.5rem; padding:2rem; box-shadow:0 8px 32px rgba(0,0,0,.18); }

        /* Form side */
        .form-side { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem 1.5rem; }
        .form-card { width:100%; max-width:420px; background:#fff; border-radius:1.25rem; padding:2.5rem 2rem; box-shadow:0 4px 30px rgba(0,0,0,.08); border:1px solid rgba(0,0,0,.05); }
        .form-header { text-align:center; margin-bottom:2rem; }
        .form-icon { display:flex; justify-content:center; margin-bottom:1rem; }
        .form-title { font-size:1.4rem; font-weight:800; color:#0d3d5c; margin:0 0 .4rem; }
        .form-hint { font-size:.82rem; color:#6b7a8d; margin:0; line-height:1.6; }

        /* Fields */
        .field { display:flex; flex-direction:column; gap:.4rem; margin-bottom:1.1rem; }
        .label { font-size:.82rem; font-weight:600; color:#374151; }
        .field-hint { font-size:.72rem; color:#9ca3af; margin:0; }
        .inp-wrap { position:relative; display:flex; align-items:center; }
        .inp { width:100%; border:1.5px solid #d1d5db; border-radius:.75rem; padding:.7rem 1rem; font-size:.88rem; font-family:'Cairo',sans-serif; background:#fafafa; outline:none; box-sizing:border-box; transition:border-color .15s, box-shadow .15s; }
        .inp:focus { border-color:#2d7a4a; box-shadow:0 0 0 3px rgba(45,122,74,.12); background:#fff; }
        .eye-btn { position:absolute; left:.75rem; background:none; border:none; cursor:pointer; font-size:.9rem; color:#9ca3af; padding:.2rem; }

        /* Error */
        .err-banner { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; border-radius:.625rem; padding:.65rem .85rem; font-size:.83rem; font-weight:500; margin-bottom:1rem; }

        /* Submit */
        .submit-btn { width:100%; margin-top:.5rem; padding:.85rem; background:linear-gradient(135deg,#2d7a4a,#1a4a2e); color:#fff; border:none; border-radius:.75rem; font-family:'Cairo',sans-serif; font-size:.95rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; box-shadow:0 2px 10px rgba(45,122,74,.3); transition:all .15s; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(45,122,74,.4); }
        .submit-btn:disabled { opacity:.65; cursor:not-allowed; }

        /* Spinner */
        .spin { display:inline-block; width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .footer-note { text-align:center; font-size:.72rem; color:#9ca3af; margin:1.5rem 0 0; }

        @media(max-width:768px) {
          .root { flex-direction:column; }
          .brand { width:100%; min-height:180px; padding:1.5rem 1rem; }
          .brand-logo { max-width:200px; padding:1rem; }
          .form-side { padding:1.5rem 1rem; align-items:flex-start; }
          .form-card { box-shadow:none; border:none; background:transparent; }
        }
      `}</style>
    </div>
  );
}

function ShieldIcon({ small }) {
  const size = small ? 40 : 72;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 4L8 18v20c0 15 11.5 29 28 33 16.5-4 28-18 28-33V18L36 4z"
        fill={small ? '#2d7a4a' : 'rgba(255,255,255,.15)'}
        stroke={small ? '#2d7a4a' : 'rgba(255,255,255,.8)'}
        strokeWidth="2" />
      <path d="M26 36l7 7 13-13" stroke={small ? '#fff' : 'rgba(255,255,255,.9)'}
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgPattern() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .06, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="geo2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,43 30,58 2,43 2,17" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="30" cy="30" r="5" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo2)" />
      <circle cx="20%" cy="20%" r="100" fill="none" stroke="white" strokeWidth="1" opacity=".5" />
      <circle cx="80%" cy="80%" r="150" fill="none" stroke="white" strokeWidth=".8" opacity=".4" />
    </svg>
  );
}
