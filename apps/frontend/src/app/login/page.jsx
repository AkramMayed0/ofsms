'use client';

/**
 * Login Page — Arabic-first RTL split layout.
 *
 * On success: stores accessToken in Zustand, then redirects to /dashboard.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/api';
import PrimaryButton from '../../components/ui/PrimaryButton';

const INITIAL_FORM = { email: '', password: '' };

const FIELD_ICON_CLASS =
  'absolute right-3.5 z-10 flex items-center text-gray-400 pointer-events-none';

const getInputClassName = (hasError) =>
  [
    'w-full rounded-xl border-[1.5px] bg-[#fafafa] py-2.5 pr-10 pl-11',
    'font-sans text-sm text-gray-800 outline-none transition',
    'ltr placeholder:text-[#c4cdd8]',
    'focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,94,140,0.12)]',
    hasError
      ? 'border-red-600 bg-red-50 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]'
      : 'border-gray-300',
  ].join(' ');

const validate = ({ email, password }) => {
  const errors = {};

  if (!email.trim()) errors.email = 'البريد الإلكتروني مطلوب';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'البريد الإلكتروني غير صحيح';
  }

  if (!password) errors.password = 'كلمة المرور مطلوبة';
  else if (password.length < 6) errors.password = 'كلمة المرور قصيرة جداً';

  return errors;
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setAuth(data.accessToken, data.user);
      router.push('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'حدث خطأ. يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#f0f4f8] font-sans md:flex-row-reverse"
      dir="rtl"
    >
      <BrandPanel />

      <main className="flex min-h-screen flex-1 items-start justify-center px-4 py-6 md:items-center md:px-6 md:py-8">
        <section className="w-full max-w-[420px] border-primary/10 bg-transparent p-5 md:rounded-[1.25rem] md:border md:bg-white md:p-8 md:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_24px_rgba(27,94,140,0.09),inset_0_1px_0_rgba(255,255,255,0.8)]">
          <MobileLogo />

          <header className="mb-7 text-right">
            <h1 className="m-0 mb-1 text-2xl font-bold text-[#0d3d5c]">تسجيل الدخول</h1>
            <p className="m-0 text-sm text-[#6b7a8d]">أدخل بياناتك للوصول إلى النظام</p>
          </header>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {apiError && <ErrorBanner message={apiError} />}

            <TextField
              id="email"
              name="email"
              type="email"
              label="البريد الإلكتروني"
              value={form.email}
              placeholder="admin@example.com"
              autoComplete="email"
              error={errors.email}
              disabled={loading}
              icon={<Mail size={16} />}
              onChange={handleChange}
            />

            <TextField
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="كلمة المرور"
              value={form.password}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password}
              disabled={loading}
              icon={<Lock size={16} />}
              onChange={handleChange}
              endControl={
                <PasswordToggle
                  visible={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                />
              }
            />

            <PrimaryButton
              type="submit"
              loading={loading}
              loadingText="جارٍ تسجيل الدخول…"
              className="mt-1 w-full justify-center gap-2 px-6 py-3"
            >
              تسجيل الدخول
            </PrimaryButton>
          </form>

          <p className="m-0 mt-6 text-center text-xs tracking-wide text-gray-400">
            مؤسسة إكرام النعمة الخيرية · نظام كفالة الأيتام
          </p>
        </section>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside
      className="relative flex min-h-[180px] w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d3d5c] via-primary to-[#1a7a6e] px-4 py-6 md:min-h-screen md:w-[42%]"
      aria-hidden="true"
    >
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <img
          src="/ikram-logo.png"
          alt="مؤسسة إكرام النعمة الخيرية"
          className="h-auto w-full max-w-[200px] p-4 md:max-w-[500px] md:p-0"
        />
      </div>
    </aside>
  );
}

function MobileLogo() {
  return (
    <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-primary md:hidden">
      <ShieldCheck size={28} className="rounded text-primary" aria-hidden="true" />
      <span>نظام إدارة الأيتام والأسر</span>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
      role="alert"
    >
      <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

function TextField({
  id,
  name,
  type,
  label,
  value,
  placeholder,
  autoComplete,
  error,
  disabled,
  icon,
  endControl,
  onChange,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="pr-0.5 text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative flex items-center">
        <span className={FIELD_ICON_CLASS}>{icon}</span>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={getInputClassName(error)}
          disabled={disabled}
          aria-describedby={error ? `${id}-err` : undefined}
          aria-invalid={!!error}
        />
        {endControl}
      </div>

      {error && (
        <p
          id={`${id}-err`}
          className="m-0 flex items-center gap-1 pr-1 text-xs text-red-600 before:text-base before:leading-none before:content-['•']"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordToggle({ visible, onClick }) {
  return (
    <button
      type="button"
      className="absolute left-3 flex cursor-pointer items-center border-none bg-transparent p-1 text-gray-400 transition hover:text-primary"
      onClick={onClick}
      aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
      tabIndex={-1}
    >
      {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );
}
