'use client';

/**
 * Landing Settings Page — إدار الموقع التعريفي
 * CMS control panel for managing the public landing page sections and content
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import {
  ExternalLink,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

const TABS = [
  { id: 'sections', label: 'الأقسام' },
  { id: 'hero', label: 'الغلاف' },
  { id: 'about', label: 'من نحن' },
  { id: 'stats', label: 'أرقامنا' },
  { id: 'programs', label: 'البرامج' },
  { id: 'news', label: 'الأخبار' },
  { id: 'gallery', label: 'المعرض' },
  { id: 'achievements', label: 'الإنجازات' },
  { id: 'partners', label: 'الشركاء' },
  { id: 'contact', label: 'التواصل والإعدادات' },
];

export default function LandingSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/landing');
      setContent(res.data.data);
    } catch (err) {
      console.error('Failed to load landing content:', err);
      showFeedback('error', 'تعذر تحميل بيانات الموقع التعريفي');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleSave = async (sectionKey = null) => {
    try {
      setSaving(true);
      if (sectionKey) {
        await api.patch(`/landing/${sectionKey}`, content[sectionKey]);
      } else {
        await api.put('/landing', content);
      }
      showFeedback('success', 'تم حفظ التغييرات بنجاح');
    } catch (err) {
      console.error('Failed to save landing content:', err);
      showFeedback('error', 'حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  // Switch Toggle Helper
  const Switch = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#1B5E8C]' : 'bg-gray-200'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? '-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  if (loading || !content) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 font-medium">جارٍ تحميل إعدادات الموقع التعريفي…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12" dir="rtl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B5E8C]">
              إدارة الموقع التعريفي
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              محتوى الصفحة الرئيسية العامة للمؤسسة
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/landing"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
            >
              <ExternalLink size={14} className="text-gray-500" />
              <span>معاينة الموقع</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
            >
              <ArrowLeft size={14} className="text-gray-500" />
              <span>لوحة التحكم</span>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Horizontal Navigation Tabs */}
        <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto shadow-inner scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1B5E8C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: الأقسام (Sections Visibility) */}
        {activeTab === 'sections' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <p className="text-xs text-gray-500">
              تحكّم بإظهار أو إخفاء أقسام الصفحة الرئيسية.
            </p>

            <div className="space-y-2.5 divide-y divide-gray-100">
              {[
                { key: 'hero', title: 'الغلاف الرئيسي', slug: 'hero' },
                { key: 'about', title: 'نبذة عن المؤسسة', slug: 'about' },
                { key: 'stats', title: 'الإحصائيات', slug: 'stats' },
                { key: 'programs', title: 'البرامج والمشاريع', slug: 'programs' },
                { key: 'news', title: 'الأخبار', slug: 'news' },
                { key: 'gallery', title: 'معرض الصور', slug: 'gallery' },
                { key: 'achievements', title: 'الإنجازات', slug: 'achievements' },
                { key: 'partners', title: 'شركاء النجاح', slug: 'partners' },
                { key: 'contact', title: 'وسائل التواصل', slug: 'contact' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="pt-2.5 first:pt-0 flex items-center justify-between py-2 px-2 hover:bg-gray-50/60 rounded-xl transition"
                >
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
                    <span className="text-[11px] text-gray-400 font-mono">{item.slug}</span>
                  </div>
                  <Switch
                    checked={content.sections?.[item.key] ?? true}
                    onChange={(val) =>
                      setContent({
                        ...content,
                        sections: { ...content.sections, [item.key]: val },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('sections')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: الغلاف (Hero) */}
        {activeTab === 'hero' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            {/* Logo and Background upload row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  شعار المؤسسة
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {content.hero?.logoUrl ? (
                      <img
                        src={content.hero.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1B5E8C] to-[#2E7EB8] flex items-center justify-center text-white font-black text-sm shadow-inner">
                        نماء
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('أدخل رابط الشعار (أو اتركه فارغاً للافتراضي):', content.hero?.logoUrl || '');
                      if (url !== null) {
                        setContent({ ...content, hero: { ...content.hero, logoUrl: url } });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
                  >
                    <Upload size={13} />
                    <span>رفع صورة</span>
                  </button>
                  {content.hero?.logoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setContent({ ...content, hero: { ...content.hero, logoUrl: '' } })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      <X size={13} />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  خلفية الغلاف
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-medium">
                    {content.hero?.bgUrl ? 'معاينة' : 'لا صورة'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('أدخل رابط صورة الخلفية:', content.hero?.bgUrl || '');
                      if (url !== null) {
                        setContent({ ...content, hero: { ...content.hero, bgUrl: url } });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
                  >
                    <Upload size={13} />
                    <span>رفع صورة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                اسم المؤسسة
              </label>
              <input
                type="text"
                value={content.hero?.foundationName || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, foundationName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الشعار النصي
              </label>
              <input
                type="text"
                value={content.hero?.slogan || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, slogan: e.target.value },
                  })
                }
                placeholder="شعار المؤسسة اللفظي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                نبذة مختصرة
              </label>
              <textarea
                rows={3}
                value={content.hero?.shortBio || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, shortBio: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نص زر الدعوة
                </label>
                <input
                  type="text"
                  value={content.hero?.ctaText || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, ctaText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رابط زر الدعوة
                </label>
                <input
                  type="text"
                  value={content.hero?.ctaLink || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, ctaLink: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C] ltr text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                نص زر الدخول
              </label>
              <input
                type="text"
                value={content.hero?.loginText || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, loginText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Switch
                checked={content.hero?.showCta ?? true}
                onChange={(val) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, showCta: val },
                  })
                }
              />
              <span className="text-xs font-bold text-gray-700">إظهار زر الدعوة</span>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('hero')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: من نحن (About) */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            {/* Section Image */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                صورة القسم
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {content.about?.imageUrl ? (
                    <img
                      src={content.about.imageUrl}
                      alt="About"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-300" size={24} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('أدخل رابط صورة قسم من نحن:', content.about?.imageUrl || '');
                    if (url !== null) {
                      setContent({ ...content, about: { ...content.about, imageUrl: url } });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-xs"
                >
                  <Upload size={13} />
                  <span>رفع صورة</span>
                </button>
                {content.about?.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setContent({ ...content, about: { ...content.about, imageUrl: '' } })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    <X size={13} />
                    <span>إزالة</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                من نحن
              </label>
              <textarea
                rows={4}
                value={content.about?.aboutText || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: { ...content.about, aboutText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الرؤية
              </label>
              <textarea
                rows={3}
                value={content.about?.vision || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: { ...content.about, vision: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الرسالة
              </label>
              <textarea
                rows={3}
                value={content.about?.mission || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: { ...content.about, mission: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                القيم
              </label>
              <textarea
                rows={5}
                value={content.about?.values || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: { ...content.about, values: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C] font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('about')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: أرقامنا (Stats) */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                أرقامنا – عدّادات تظهر في الصفحة الرئيسية.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newStat = {
                    id: String(Date.now()),
                    title: 'عنوان الإحصائية',
                    value: '100',
                    description: 'وصف مختصر يوضح أثر الإحصائية',
                    active: true,
                  };
                  setContent({
                    ...content,
                    stats: [...(content.stats || []), newStat],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة</span>
              </button>
            </div>

            <div className="space-y-3">
              {(content.stats || []).map((stat, idx) => (
                <div
                  key={stat.id || idx}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-xs flex flex-col md:flex-row items-center gap-3"
                >
                  <div className="w-full md:w-1/4">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={stat.title}
                      onChange={(e) => {
                        const updated = [...content.stats];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, stats: updated });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1B5E8C]"
                    />
                  </div>

                  <div className="w-full md:w-1/6">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      القيمة
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const updated = [...content.stats];
                        updated[idx].value = e.target.value;
                        setContent({ ...content, stats: updated });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#1B5E8C] focus:outline-none focus:border-[#1B5E8C] text-center"
                    />
                  </div>

                  <div className="w-full md:flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      وصف
                    </label>
                    <input
                      type="text"
                      value={stat.description}
                      onChange={(e) => {
                        const updated = [...content.stats];
                        updated[idx].description = e.target.value;
                        setContent({ ...content, stats: updated });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#1B5E8C]"
                    />
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center pt-2 md:pt-4">
                    <Switch
                      checked={stat.active ?? true}
                      onChange={(val) => {
                        const updated = [...content.stats];
                        updated[idx].active = val;
                        setContent({ ...content, stats: updated });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.stats.filter((_, i) => i !== idx);
                        setContent({ ...content, stats: updated });
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('stats')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: البرامج (Programs) */}
        {activeTab === 'programs' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                البرامج والمشاريع التنموية والخيرية للمؤسسة.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newProg = {
                    id: String(Date.now()),
                    title: 'برنامج تنموي جديد',
                    category: 'رعاية اجتماعية',
                    description: 'وصف البرنامج وأهدافه والأنشطة المتضمنة',
                    beneficiaries: '100+ مستفيد',
                    active: true,
                  };
                  setContent({
                    ...content,
                    programs: [...(content.programs || []), newProg],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة برنامج</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(content.programs || []).map((prog, idx) => (
                <div
                  key={prog.id || idx}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={prog.title}
                      onChange={(e) => {
                        const updated = [...content.programs];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, programs: updated });
                      }}
                      className="font-bold text-sm text-gray-800 border-b border-dashed border-gray-300 pb-1 w-full focus:outline-none focus:border-[#1B5E8C]"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={prog.active ?? true}
                        onChange={(val) => {
                          const updated = [...content.programs];
                          updated[idx].active = val;
                          setContent({ ...content, programs: updated });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.programs.filter((_, i) => i !== idx);
                          setContent({ ...content, programs: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-medium">التصنيف</label>
                      <input
                        type="text"
                        value={prog.category}
                        onChange={(e) => {
                          const updated = [...content.programs];
                          updated[idx].category = e.target.value;
                          setContent({ ...content, programs: updated });
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E8C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-medium">المستفيدون</label>
                      <input
                        type="text"
                        value={prog.beneficiaries}
                        onChange={(e) => {
                          const updated = [...content.programs];
                          updated[idx].beneficiaries = e.target.value;
                          setContent({ ...content, programs: updated });
                        }}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E8C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 font-medium">الوصف</label>
                    <textarea
                      rows={2}
                      value={prog.description}
                      onChange={(e) => {
                        const updated = [...content.programs];
                        updated[idx].description = e.target.value;
                        setContent({ ...content, programs: updated });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E8C]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('programs')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: الأخبار (News) */}
        {activeTab === 'news' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                أحدث أخبار وفعاليات ومشاريع المؤسسة.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newArticle = {
                    id: String(Date.now()),
                    title: 'عنوان خبر جديد',
                    date: new Date().toISOString().split('T')[0],
                    summary: 'ملخص وتفاصيل الخبر المنشور',
                    active: true,
                  };
                  setContent({
                    ...content,
                    news: [...(content.news || []), newArticle],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة خبر</span>
              </button>
            </div>

            <div className="space-y-3">
              {(content.news || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...content.news];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, news: updated });
                      }}
                      className="font-bold text-sm text-gray-800 border-b border-dashed border-gray-300 pb-1 w-full focus:outline-none focus:border-[#1B5E8C]"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.active ?? true}
                        onChange={(val) => {
                          const updated = [...content.news];
                          updated[idx].active = val;
                          setContent({ ...content, news: updated });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = content.news.filter((_, i) => i !== idx);
                          setContent({ ...content, news: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        const updated = [...content.news];
                        updated[idx].date = e.target.value;
                        setContent({ ...content, news: updated });
                      }}
                      className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={item.summary}
                    onChange={(e) => {
                      const updated = [...content.news];
                      updated[idx].summary = e.target.value;
                      setContent({ ...content, news: updated });
                    }}
                    placeholder="ملخص الخبر…"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1B5E8C]"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('news')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 7: المعرض (Gallery) */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                ألبوم صور توثيق أنشطة ومشاريع المؤسسة.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newImg = {
                    id: String(Date.now()),
                    title: 'صورة فعالية جديدة',
                    category: 'ميداني',
                    imageUrl: '',
                  };
                  setContent({
                    ...content,
                    gallery: [...(content.gallery || []), newImg],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة صورة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(content.gallery || []).map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-xs space-y-2.5"
                >
                  <div className="h-32 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-150">
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-gray-300" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={img.title}
                    onChange={(e) => {
                      const updated = [...content.gallery];
                      updated[idx].title = e.target.value;
                      setContent({ ...content, gallery: updated });
                    }}
                    placeholder="عنوان الصورة"
                    className="w-full text-xs font-bold px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={img.category}
                      onChange={(e) => {
                        const updated = [...content.gallery];
                        updated[idx].category = e.target.value;
                        setContent({ ...content, gallery: updated });
                      }}
                      placeholder="التصنيف"
                      className="text-[11px] px-2 py-1 border border-gray-200 rounded-lg text-gray-500 w-24"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = content.gallery.filter((_, i) => i !== idx);
                        setContent({ ...content, gallery: updated });
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('gallery')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 8: الإنجازات (Achievements) */}
        {activeTab === 'achievements' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                أبرز إنجازات وجوائز ومحطات نجاح المؤسسة.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newAch = {
                    id: String(Date.now()),
                    title: 'إنجاز جديد',
                    year: '2026',
                    description: 'وصف وأثر الإنجاز المحقق',
                  };
                  setContent({
                    ...content,
                    achievements: [...(content.achievements || []), newAch],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة إنجاز</span>
              </button>
            </div>

            <div className="space-y-3">
              {(content.achievements || []).map((ach, idx) => (
                <div
                  key={ach.id || idx}
                  className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs flex items-center gap-4"
                >
                  <input
                    type="text"
                    value={ach.year}
                    onChange={(e) => {
                      const updated = [...content.achievements];
                      updated[idx].year = e.target.value;
                      setContent({ ...content, achievements: updated });
                    }}
                    className="w-20 text-center font-bold text-sm text-[#1B5E8C] bg-blue-50 py-2 rounded-xl border border-blue-200"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={ach.title}
                      onChange={(e) => {
                        const updated = [...content.achievements];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, achievements: updated });
                      }}
                      className="font-bold text-xs text-gray-800 w-full border-b border-gray-200 pb-0.5 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ach.description}
                      onChange={(e) => {
                        const updated = [...content.achievements];
                        updated[idx].description = e.target.value;
                        setContent({ ...content, achievements: updated });
                      }}
                      className="text-xs text-gray-500 w-full focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = content.achievements.filter((_, i) => i !== idx);
                      setContent({ ...content, achievements: updated });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('achievements')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 9: الشركاء (Partners) */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                شركاء النجاح والجهات الداعمة للمؤسسة.
              </p>
              <button
                type="button"
                onClick={() => {
                  const newPartner = {
                    id: String(Date.now()),
                    name: 'شريك استراتيجي جديد',
                    category: 'شريك محلي',
                  };
                  setContent({
                    ...content,
                    partners: [...(content.partners || []), newPartner],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <Plus size={14} />
                <span>إضافة شريك</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {(content.partners || []).map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3.5 rounded-2xl border border-gray-200 bg-white shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const updated = [...content.partners];
                        updated[idx].name = e.target.value;
                        setContent({ ...content, partners: updated });
                      }}
                      className="font-bold text-xs text-gray-800 w-full focus:outline-none"
                    />
                    <input
                      type="text"
                      value={p.category}
                      onChange={(e) => {
                        const updated = [...content.partners];
                        updated[idx].category = e.target.value;
                        setContent({ ...content, partners: updated });
                      }}
                      className="text-[11px] text-gray-400 w-full focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = content.partners.filter((_, i) => i !== idx);
                      setContent({ ...content, partners: updated });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('partners')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 10: التواصل والإعدادات (Contact) */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            <p className="text-xs text-gray-500">
              بيانات التواصل والمقر وعناوين حسابات التواصل الاجتماعي.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رقم الهاتف الثابت
                </label>
                <input
                  type="text"
                  value={content.contact?.phone || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, phone: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm ltr text-right focus:outline-none focus:border-[#1B5E8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رقم الجوال / واتساب
                </label>
                <input
                  type="text"
                  value={content.contact?.mobile || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, mobile: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm ltr text-right focus:outline-none focus:border-[#1B5E8C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={content.contact?.email || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, email: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm ltr text-right focus:outline-none focus:border-[#1B5E8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  أوقات العمل
                </label>
                <input
                  type="text"
                  value={content.contact?.workingHours || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, workingHours: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E8C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                العنوان الجغرافي
              </label>
              <input
                type="text"
                value={content.contact?.address || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: { ...content.contact, address: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E8C]"
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 mb-3">
                روابط التواصل الاجتماعي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {['facebook', 'twitter', 'instagram', 'youtube'].map((net) => (
                  <div key={net}>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 capitalize">
                      {net === 'twitter' ? 'X (تويتر سابقاً)' : net}
                    </label>
                    <input
                      type="text"
                      value={content.contact?.social?.[net] || ''}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          contact: {
                            ...content.contact,
                            social: {
                              ...content.contact?.social,
                              [net]: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs ltr text-right focus:outline-none focus:border-[#1B5E8C]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => handleSave('contact')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition active:scale-95 disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
