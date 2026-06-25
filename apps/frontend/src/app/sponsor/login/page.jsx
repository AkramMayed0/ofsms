'use client';

/**
 * Route: /sponsor/login
 * API:   POST /api/sponsor/login  { portalToken, password }
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Lock, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import useSponsorStore from '@/store/useSponsorStore';
import Spinner from '@/components/ui/Spinner';

const API_LOGIN_URL = `${process.env.NEXT_PUBLIC_API_URL}/sponsor/login`;

export default function SponsorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSponsorAuth = useSponsorStore((s) => s.setSponsorAuth);

  const [portalToken, setPortalToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="flex flex-col md:flex-row-reverse min-h-screen font-sans bg-slate-50" dir="rtl">
      
      {/* ── Brand / Hero Panel (Right side in RTL) ── */}
      <aside className="relative md:w-[45%] lg:w-[50%] bg-gradient-to-br from-[#0B2F44] via-[#124b6e] to-[#0A4A3E] flex items-center justify-center overflow-hidden shrink-0 min-h-[300px] md:min-h-screen">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#1da07f] blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[10%] -left-[10%] w-[400px] h-[400px] rounded-full bg-[#3b82f6] blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        </div>
        
        {/* Glassmorphic Brand Card */}
        <div className="relative z-10 w-[80%] max-w-[400px] flex flex-col items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center w-full transform transition-transform duration-700 hover:scale-105">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1cd29c] to-[#0d7d59] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(28,210,156,0.3)] mb-6">
              <ShieldCheck size={40} className="text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight text-center">بوابة الكافل</h1>
            <p className="text-sm font-medium text-blue-100/80 text-center leading-relaxed">
              نافذتك المباشرة لمتابعة أيتامك، الاطلاع على تقاريرهم، والمساهمة في بناء مستقبلهم.
            </p>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6" />
            
            <div className="flex items-center gap-2 text-white/90 text-xs font-semibold tracking-wider">
              <span>مؤسسة إكرام النعمة الخيرية</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Login Form Panel (Left side in RTL) ── */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-slate-50">
        <div className="w-full max-w-[440px]">
          
          <div className="mb-10">
            <h2 className="text-[2rem] font-black text-slate-800 mb-3 tracking-tight">تسجيل الدخول</h2>
            <p className="text-slate-500 font-medium">أدخل رمز البوابة وكلمة المرور للوصول لحسابك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 rounded-2xl p-4 animate-in slide-in-from-top-2 fade-in duration-300">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {/* Portal Token Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">رمز البوابة</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <KeyRound size={20} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 pr-12 pl-4 text-slate-800 font-medium placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  placeholder="أدخل الرمز الخاص بك"
                  value={portalToken}
                  onChange={(e) => setPortalToken(e.target.value)}
                  disabled={loading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">كلمة المرور</label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={20} strokeWidth={2} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 pr-12 pl-12 text-slate-800 font-medium placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 tracking-widest"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  <span className="text-lg">{showPass ? '🙈' : '👁'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group relative w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base transition-all duration-200 overflow-hidden shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {/* Subtle hover gradient effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              
              {loading ? (
                <><Spinner size="md" />جاري الدخول...</>
              ) : (
                <>
                  <span>متابعة للدخول</span>
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-10 text-center">
            <p className="text-xs font-medium text-slate-400">
              يتم إصدار بيانات الدخول حصرياً من قِبل إدارة المؤسسة.<br/>
              في حال فقدان البيانات، يرجى التواصل مع الدعم الفني.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
