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
import { AlertTriangle } from 'lucide-react';

import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useSponsorStore from '@/store/useSponsorStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_LOGIN_URL = `${process.env.NEXT_PUBLIC_API_URL}/sponsor/login`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SponsorLoginPage() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const setSponsorAuth = useSponsorStore((s) => s.setSponsorAuth);

  const [portalToken, setPortalToken] = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

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
      const { data } = await axios.post(API_LOGIN_URL, {
        portalToken: portalToken.trim(),
        password,
      });
      setSponsorAuth(data.accessToken, data.sponsor);
      router.push('/sponsor/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'رمز البوابة أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row-reverse min-h-screen font-sans bg-gray-100" dir="rtl">

      {/* Decorative side */}
      <aside className="relative w-[42%] bg-gradient-to-[160deg] from-[#1a4a2e] via-[#2d7a4a] to-[#1B5E8C] flex items-center justify-center overflow-hidden shrink-0 hidden md:flex">
        <div className="relative z-10 text-center py-10 px-8 flex flex-col items-center justify-center">
          <img
            src="/ikram-logo.png"
            alt="مؤسسة إكرام النعمة الخيرية"
            className="max-w-[300px] w-4/5 h-auto object-contain bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
          />
        </div>
      </aside>

      {/* Login form */}
      <main className="flex-1 flex items-center justify-center py-8 px-6">
        <div className="w-full max-w-[420px] bg-white rounded-2xl py-10 px-8 shadow-[0_4px_30px_rgba(0,0,0,0.08)] border border-black/5">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ShieldIcon />
            </div>
            <h2 className="text-[1.4rem] font-extrabold text-[#0d3d5c] m-0 mb-1.5">تسجيل دخول الكافل</h2>
            <p className="text-[0.82rem] text-[#6b7a8d] m-0 leading-relaxed">أدخل بياناتك للاطلاع على أيتامك ومتابعة تقاريرهم</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl py-2.5 px-3.5 text-[0.83rem] font-medium mb-4">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* Portal token field */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[0.82rem] font-semibold text-gray-700">رمز البوابة</label>
              <input
                className="w-full border-[1.5px] border-gray-300 rounded-xl py-2.5 px-4 text-[0.88rem] font-sans bg-gray-50 outline-none box-border transition-colors focus:border-[#2d7a4a] focus:shadow-[0_0_0_3px_rgba(45,122,74,0.12)] focus:bg-white disabled:opacity-60"
                type="text"
                placeholder="أدخل رمز البوابة الخاص بك"
                value={portalToken}
                onChange={(e) => setPortalToken(e.target.value)}
                disabled={loading}
                dir="ltr"
              />
              <p className="text-[0.72rem] text-gray-400 m-0">الرمز مُرسَل إليك من قِبَل المؤسسة أو موجود في الرابط</p>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[0.82rem] font-semibold text-gray-700">كلمة المرور</label>
              <div className="relative flex items-center">
                <input
                  className="w-full border-[1.5px] border-gray-300 rounded-xl py-2.5 px-4 text-[0.88rem] font-sans bg-gray-50 outline-none box-border transition-colors focus:border-[#2d7a4a] focus:shadow-[0_0_0_3px_rgba(45,122,74,0.12)] focus:bg-white disabled:opacity-60"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute left-3 bg-transparent border-none cursor-pointer text-[0.9rem] text-gray-400 p-0.5"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-gradient-to-br from-[#2d7a4a] to-[#1a4a2e] text-white border-none rounded-xl font-sans text-[0.95rem] font-bold cursor-pointer flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(45,122,74,0.3)] transition-all hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[0_4px_16px_rgba(45,122,74,0.4)] disabled:opacity-65 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? <><span className="inline-block w-[15px] h-[15px] border-2 border-white/40 border-t-white rounded-full animate-spin" />جارٍ تسجيل الدخول…</>
                : 'دخول البوابة ←'
              }
            </button>
          </form>

          <p className="text-center text-[0.72rem] text-gray-400 mt-6 mb-0">
            إذا لم يكن لديك رمز بوابة، تواصل مع مؤسسة إكرام النعمة الخيرية
          </p>
        </div>
      </main>
    </div>
  );
}

// ── ShieldIcon ────────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width={40} height={40} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M36 4L8 18v20c0 15 11.5 29 28 33 16.5-4 28-18 28-33V18L36 4z"
        fill="#2d7a4a"
        stroke="#2d7a4a"
        strokeWidth="2"
      />
      <path
        d="M26 36l7 7 13-13"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
