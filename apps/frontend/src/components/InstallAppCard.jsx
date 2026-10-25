'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, CheckCircle } from 'lucide-react';

const APK_URL = '/ofsms.apk';

/** Install-to-phone card: PWA install prompt (Android/Chrome), iOS steps, optional APK link. */
export default function InstallAppCard() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [hasApk, setHasApk] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIos(/iphone|ipad|ipod/i.test(ua));
    if (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone) {
      setInstalled(true);
    }
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => setHasApk(r.ok && !(r.headers.get('content-type') || '').includes('text/html')))
      .catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const btn = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-primary to-primary-dark cursor-pointer no-underline';

  return (
    <div className="card max-w-xl mx-auto text-center space-y-5" dir="rtl">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 dark:bg-sky-500/10 flex items-center justify-center">
        <Smartphone size={32} className="text-primary dark:text-sky-400" />
      </div>
      <div>
        <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">حمّل التطبيق على هاتفك</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          ثبّت نظام نماء على شاشة هاتفك للوصول السريع، ويعمل بملء الشاشة مثل أي تطبيق.
        </p>
      </div>

      {installed && (
        <p className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          <CheckCircle size={18} /> التطبيق مثبّت بالفعل على هذا الجهاز
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {deferred && (
          <button type="button" onClick={install} className={btn}>
            <Download size={18} /> تثبيت التطبيق
          </button>
        )}
        {hasApk && (
          <a href={APK_URL} download className={btn}>
            <Download size={18} /> تحميل ملف APK (أندرويد)
          </a>
        )}
      </div>

      {!deferred && !installed && (
        <div className="text-start text-sm text-gray-600 dark:text-slate-300 space-y-2 bg-gray-50 dark:bg-[#17283C] rounded-xl p-4">
          {isIos ? (
            <ol className="list-decimal pr-5 space-y-1.5">
              <li>افتح الموقع في متصفح <b>Safari</b>.</li>
              <li className="flex items-center gap-1 flex-wrap">اضغط زر المشاركة <Share size={15} className="inline" /></li>
              <li className="flex items-center gap-1 flex-wrap">اختر <b>إضافة إلى الشاشة الرئيسية</b> <PlusSquare size={15} className="inline" /></li>
            </ol>
          ) : (
            <ol className="list-decimal pr-5 space-y-1.5">
              <li>افتح الموقع في متصفح <b>Chrome</b> على هاتفك.</li>
              <li>اضغط على قائمة المتصفح (⋮).</li>
              <li>اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
