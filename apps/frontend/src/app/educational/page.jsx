'use client';

/**
 * /educational/page.jsx
 * البرامج التربوية والتوعوية والأنشطة — مؤسسة نماء التنموية الخيرية
 *
 * Elevated custom design matching OFSMS design system:
 *   - Tab 1: البرامج والأنشطة (Programs & Activities)
 *   - Tab 2: قوالب البرامج المتكررة (Recurring Program Templates)
 *   - Rich KPI stats overview
 *   - Dynamic search, status & category filtering
 *   - Program Details Modal with action buttons (Approve/Activate, Edit, Cancel/Delete)
 *   - Orphan Participant Management (Enroll orphans, track sessions attended, update status)
 *   - Template creation, editing, and 1-click "استخدام القالب" to launch new programs
 *   - Strict required validation on all forms
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Calendar, MapPin, Users, Plus, Search, Filter,
  CheckCircle2, Clock, Trash2, Edit3, X, ChevronDown, Check,
  AlertCircle, ArrowRight, Sparkles, BookOpen, Layers, Award,
  FileText, UserCheck, ShieldCheck, RefreshCw, Eye, Tag,
  AlertTriangle, UserPlus, BookMarked, Compass, HeartHandshake
} from 'lucide-react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Helpers & Formatting ──────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('ar-YE', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return String(d);
  }
};

const formatDateInput = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const STATUS_CONFIG = {
  active: {
    label: 'نشط ومستمر',
    badge: 'bg-emerald-500 text-white',
    lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'مكتمل',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    lightBg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-emerald-600',
  },
  draft: {
    label: 'مسودة',
    badge: 'bg-slate-100 text-slate-700 border border-slate-300',
    lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-slate-400',
  },
  cancelled: {
    label: 'ملغي',
    badge: 'bg-rose-100 text-rose-800 border border-rose-200',
    lightBg: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
  },
};

const PARTICIPANT_STATUS_CONFIG = {
  enrolled: { label: 'مسجل', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  active: { label: 'مواظب', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'أتم البرنامج', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  withdrawn: { label: 'منسحب', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function EducationalPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const canManage = ['gm', 'supervisor', 'agent'].includes(user?.role);
  const isHighAdmin = ['gm', 'supervisor'].includes(user?.role);

  // Active Tab: 'programs' | 'templates'
  const [activeTab, setActiveTab] = useState('programs');

  // Core Data
  const [programs, setPrograms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters for Programs
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addParticipantsModalOpen, setAddParticipantsModalOpen] = useState(false);
  const [deleteProgramConfirm, setDeleteProgramConfirm] = useState(null);

  // Template Modals state
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTemplateConfirm, setDeleteTemplateConfirm] = useState(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // ── Fetch All Data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [progRes, tmplRes, catRes, orphansRes] = await Promise.allSettled([
        api.get('/educational/programs'),
        api.get('/educational/templates'),
        api.get('/educational/categories'),
        api.get('/orphans'),
      ]);

      if (progRes.status === 'fulfilled' && progRes.value.data?.data) {
        setPrograms(progRes.value.data.data);
      }
      if (tmplRes.status === 'fulfilled' && tmplRes.value.data?.data) {
        setTemplates(tmplRes.value.data.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
        setCategories(catRes.value.data.data);
      }
      if (orphansRes.status === 'fulfilled' && orphansRes.value.data?.orphans) {
        setOrphans(orphansRes.value.data.orphans);
      }
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل بيانات البرامج التربوية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Load Single Program Details (with participants)
  const openProgramDetails = async (programId) => {
    try {
      const res = await api.get(`/educational/programs/${programId}`);
      if (res.data?.data) {
        setSelectedProgram(res.data.data);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('تعذر تحميل تفاصيل البرنامج', 'error');
    }
  };

  const refreshSelectedProgram = async (programId) => {
    try {
      const res = await api.get(`/educational/programs/${programId}`);
      if (res.data?.data) {
        setSelectedProgram(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Filtered Programs ───────────────────────────────────────────────────────
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && String(p.category_id) !== String(categoryFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(q);
        const locMatch = (p.location || '').toLowerCase().includes(q);
        const catMatch = (p.category_name || '').toLowerCase().includes(q);
        if (!titleMatch && !locMatch && !catMatch) return false;
      }
      return true;
    });
  }, [programs, statusFilter, categoryFilter, search]);

  // ── Stats Calculations ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPrograms = programs.length;
    const activePrograms = programs.filter((p) => p.status === 'active').length;
    const completedPrograms = programs.filter((p) => p.status === 'completed').length;
    const totalParticipants = programs.reduce((acc, p) => acc + (parseInt(p.participant_count, 10) || 0), 0);
    const totalTemplates = templates.length;
    return { totalPrograms, activePrograms, completedPrograms, totalParticipants, totalTemplates };
  }, [programs, templates]);

  // ── Launch Program From Template ────────────────────────────────────────────
  const handleUseTemplate = (template) => {
    setEditingProgram({
      template_id: template.id,
      title: template.title,
      category_id: template.category_id,
      total_sessions: template.default_sessions || 1,
      target_count: 20,
      notes: template.description || '',
      status: 'draft',
      location: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + (template.default_duration_days || 14) * 86400000).toISOString().split('T')[0],
    });
    setCreateProgramModalOpen(true);
  };

  return (
    <AppShell>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 animate-slide-up ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toast.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-blue-50 text-[#1B5E8C] border-blue-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#1B5E8C] flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
        {/* ── Top Header with Brand & Navigation ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1B5E8C] bg-blue-50 px-3 py-1 rounded-full w-fit mb-2 border border-blue-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مؤسسة نماء التنموية الخيرية — رعاية وتأهيل الأيتام</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white rounded-2xl shadow-md shadow-[0_4px_12px_rgba(27,94,140,0.25)]">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  البرامج التربوية والتوعوية
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  تخطيط وإدارة وتنفيذ الدورات والأنشطة التربوية والمهنية وتنمية قدرات الأيتام
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <span>رجوع للوحة التحكم</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="p-2.5 text-slate-500 hover:text-[#1B5E8C] bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition shadow-sm"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── KPI Metric Highlights ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#1B5E8C]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">إجمالي البرامج المنفذة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalPrograms}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[#1B5E8C] font-semibold">{stats.completedPrograms}</span> مكتمل بنجاح
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#2E7EB8]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">البرامج الجارية والنشطة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activePrograms}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              قيد التنفيذ حالياً
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">الأيتام المستفيدون</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalParticipants}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              مشارك في الأنشطة والدورات
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">قوالب البرامج المعتمدة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTemplates}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookMarked className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              جاهزة للإطلاق بضغطة واحدة
            </div>
          </div>
        </div>

        {/* ── Modern Tabs Switcher ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                activeTab === 'programs'
                  ? 'bg-white text-slate-900 shadow-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>البرامج والأنشطة</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'programs' ? 'bg-blue-100 text-[#1B5E8C] font-bold' : 'bg-slate-200 text-slate-600'}`}>
                {programs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                activeTab === 'templates'
                  ? 'bg-white text-slate-900 shadow-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>القوالب</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'templates' ? 'bg-blue-100 text-[#1B5E8C] font-bold' : 'bg-slate-200 text-slate-600'}`}>
                {templates.length}
              </span>
            </button>
          </div>

          {/* Action button corresponding to active tab */}
          {activeTab === 'programs' ? (
            canManage && (
              <button
                onClick={() => {
                  setEditingProgram(null);
                  setCreateProgramModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(27,94,140,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>برنامج جديد +</span>
              </button>
            )
          ) : (
            isHighAdmin && (
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setCreateTemplateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(27,94,140,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>قالب جديد +</span>
              </button>
            )
          )}
        </div>

        {/* ── TAB 1: البرامج والأنشطة (Programs & Activities) ───────────────── */}
        {activeTab === 'programs' && (
          <div className="space-y-6">
            {/* Header title */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-700">
                قائمة البرامج التربوية والأنشطة
              </h2>
            </div>

            {/* Search & Filters Row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="...بحث بالاسم، المكان أو الوصف"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C] transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C] transition"
                >
                  <option value="all">كل الحالات</option>
                  <option value="draft">مسودة</option>
                  <option value="active">نشط ومستمر</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C] transition"
                >
                  <option value="all">كل التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Programs Cards Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" className="text-[#1B5E8C]" />
                <p className="text-sm font-medium text-slate-500">جاري تحميل البرامج التربوية...</p>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد برامج مطابقة</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  لم يتم العثور على أي برامج تربوية وفق معايير البحث المحددة. يمكنك إضافة برنامج جديد الآن.
                </p>
                {canManage && (
                  <button
                    onClick={() => {
                      setEditingProgram(null);
                      setCreateProgramModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white font-bold text-sm rounded-xl transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة برنامج جديد</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrograms.map((prog) => {
                  const statusConf = STATUS_CONFIG[prog.status] || STATUS_CONFIG.draft;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => openProgramDetails(prog.id)}
                      className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-[#1B5E8C]/50 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Row: Category subtitle & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-[#1B5E8C] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {prog.category_name || 'عام'}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusConf.badge}`}>
                          {statusConf.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1B5E8C] transition leading-snug">
                          {prog.title}
                        </h3>
                        {prog.notes && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {prog.notes}
                          </p>
                        )}
                      </div>

                      {/* Metadata Details (Dates, Location, Sessions) */}
                      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        {/* Dates */}
                        {(prog.start_date || prog.end_date) && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {fmtDate(prog.start_date)} — {fmtDate(prog.end_date)}
                            </span>
                          </div>
                        )}

                        {/* Location */}
                        {prog.location && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{prog.location}</span>
                          </div>
                        )}

                        {/* Sessions & Participants */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-medium text-slate-600">
                            الجلسات: <span className="font-bold text-slate-900">{prog.total_sessions || 1}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[#1B5E8C] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            <Users className="w-3.5 h-3.5" />
                            <span>{prog.participant_count || 0} مشارك</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: قوالب البرامج المتكررة (Templates) ──────────────────────── */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-700">
                  قوالب البرامج المتكررة (موسمية، دورية)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  نماذج معدة مسبقاً للدورات والورش المتكررة تتيح إطلاق البرامج ببياناتها القياسية بضغطة زر
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" className="text-[#1B5E8C]" />
                <p className="text-sm font-medium text-slate-500">جاري تحميل القوالب...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                  <BookMarked className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد قوالب معتمدة بعد</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  أنشئ أول قالب لدورة متكررة لتسهيل جدولة البرامج اللاحقة.
                </p>
                {isHighAdmin && (
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setCreateTemplateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white font-bold text-sm rounded-xl transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء قالب جديد</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group"
                  >
                    <div>
                      {/* Top: Category Pill & Usage Count */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-xs font-semibold text-[#1B5E8C] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {tmpl.category_name || 'عام'}
                        </span>
                        {tmpl.usage_count > 0 && (
                          <span className="text-xs text-slate-400 font-medium">
                            استُخدم {tmpl.usage_count} مرة
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1B5E8C] transition">
                        {tmpl.title}
                      </h3>

                      {/* Description */}
                      {tmpl.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                          {tmpl.description}
                        </p>
                      )}

                      {/* Details: Duration & Sessions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>
                          <span className="text-slate-400">المدة الافتراضية:</span>
                          <span className="font-bold text-slate-800 mr-1">
                            {tmpl.default_duration_days || 14} يوم
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">الجلسات:</span>
                          <span className="font-bold text-slate-800 mr-1">
                            {tmpl.default_sessions || 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Use Template, Edit, Delete */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleUseTemplate(tmpl)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl transition shadow-[0_2px_8px_rgba(27,94,140,0.25)] hover:scale-[1.01]"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>استخدام القالب</span>
                      </button>

                      {isHighAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setCreateTemplateModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-[#1B5E8C] hover:bg-blue-50 rounded-lg transition"
                            title="تعديل القالب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTemplateConfirm(tmpl)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف القالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 1: PROGRAM DETAILS & PARTICIPANTS MODAL
      ────────────────────────────────────────────────────────────────────────── */}
      {detailsModalOpen && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#1B5E8C] rounded-2xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedProgram.title}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[selectedProgram.status]?.badge || ''}`}>
                      {STATUS_CONFIG[selectedProgram.status]?.label || selectedProgram.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    التصنيف: <span className="font-semibold text-[#1B5E8C]">{selectedProgram.category_name || 'عام'}</span>
                    {selectedProgram.instructor_name && (
                      <span className="mr-3">المدرب: <span className="font-medium text-slate-700">{selectedProgram.instructor_name}</span></span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header matching user screenshot */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Activate / Complete Button */}
                {canManage && selectedProgram.status === 'draft' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/educational/programs/${selectedProgram.id}/status`, { status: 'active' });
                        showToast('تم اعتماد وتفعيل البرنامج بنجاح');
                        refreshSelectedProgram(selectedProgram.id);
                        fetchAll();
                      } catch (err) {
                        showToast('تعذر اعتماد البرنامج', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد البرنامج</span>
                  </button>
                )}

                {canManage && selectedProgram.status === 'active' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/educational/programs/${selectedProgram.id}/status`, { status: 'completed' });
                        showToast('تم إكمال البرنامج بنجاح');
                        refreshSelectedProgram(selectedProgram.id);
                        fetchAll();
                      } catch (err) {
                        showToast('تعذر إكمال البرنامج', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إتمام البرنامج</span>
                  </button>
                )}

                {/* Edit Button */}
                {canManage && (
                  <button
                    onClick={() => {
                      setEditingProgram(selectedProgram);
                      setDetailsModalOpen(false);
                      setCreateProgramModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <span>تعديل البيانات</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Info Badges & Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <p className="text-xs text-slate-400">عدد الجلسات:</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedProgram.total_sessions || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">الفترة الزمنية:</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {fmtDate(selectedProgram.start_date)} - {fmtDate(selectedProgram.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">الموقع / المركز:</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{selectedProgram.location || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">المستهدف:</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedProgram.target_count || 20} يتيم</p>
                </div>
              </div>

              {selectedProgram.notes && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#1B5E8C] block mb-1">وصف البرنامج وملاحظات:</span>
                  {selectedProgram.notes}
                </div>
              )}

              {/* Participants Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-[#1B5E8C] rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">المشاركون</h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {selectedProgram.participants?.length || 0}
                    </span>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => setAddParticipantsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة مشاركين +</span>
                    </button>
                  )}
                </div>

                {/* Participants List / Empty State */}
                {!selectedProgram.participants || selectedProgram.participants.length === 0 ? (
                  <div className="py-12 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">لا يوجد مشاركون بعد.</p>
                    <p className="text-xs text-slate-400 mt-1">انقر على &quot;إضافة مشاركين&quot; لضم أيتام إلى هذا البرنامج.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">كود اليتيم</th>
                          <th className="py-3 px-4">اسم اليتيم</th>
                          <th className="py-3 px-4">العمر</th>
                          <th className="py-3 px-4">المحافظة</th>
                          <th className="py-3 px-4">الجلسات المكتملة</th>
                          <th className="py-3 px-4">الحالة</th>
                          {canManage && <th className="py-3 px-4 text-center">إجراءات</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedProgram.participants.map((part) => {
                          const partStatus = PARTICIPANT_STATUS_CONFIG[part.status] || PARTICIPANT_STATUS_CONFIG.enrolled;
                          const age = calcAge(part.date_of_birth);
                          return (
                            <tr key={part.participant_id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                {part.orphan_code || `ORP-${part.orphan_id}`}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <Link
                                  href={`/orphans/${part.orphan_id}`}
                                  className="hover:text-[#1B5E8C] hover:underline"
                                >
                                  {part.orphan_name}
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {age ? `${age} سنة` : '—'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {part.governorate_ar || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    {part.attended_sessions || 0} / {selectedProgram.total_sessions || 1}
                                  </span>
                                  {canManage && (
                                    <button
                                      onClick={async () => {
                                        const newCount = (part.attended_sessions || 0) + 1;
                                        try {
                                          await api.patch(`/educational/participants/${part.participant_id}`, {
                                            attendedSessions: newCount,
                                          });
                                          refreshSelectedProgram(selectedProgram.id);
                                        } catch (err) {
                                          showToast('تعذر تحديث الحضور', 'error');
                                        }
                                      }}
                                      className="p-1 text-[#1B5E8C] hover:bg-blue-50 rounded font-bold"
                                      title="زيادة جلسة حضور"
                                    >
                                      +1
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${partStatus.bg}`}>
                                  {partStatus.label}
                                </span>
                              </td>
                              {canManage && (
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={async () => {
                                      if (confirm(`هل أنت متأكد من إزالة اليتيم (${part.orphan_name}) من البرنامج؟`)) {
                                        try {
                                          await api.delete(`/educational/participants/${part.participant_id}`);
                                          showToast('تمت إزالة المشارك');
                                          refreshSelectedProgram(selectedProgram.id);
                                          fetchAll();
                                        } catch (err) {
                                          showToast('تعذر إزالة المشارك', 'error');
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="إزالة المشارك"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {isHighAdmin && (
                <button
                  onClick={() => {
                    setDeleteProgramConfirm(selectedProgram);
                    setDetailsModalOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف البرنامج</span>
                </button>
              )}
              <div className="mr-auto">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: ADD PARTICIPANTS (ORPHAN SELECTOR)
      ────────────────────────────────────────────────────────────────────────── */}
      {addParticipantsModalOpen && selectedProgram && (
        <OrphanSelectorModal
          program={selectedProgram}
          orphans={orphans}
          onClose={() => setAddParticipantsModalOpen(false)}
          onSuccess={() => {
            setAddParticipantsModalOpen(false);
            refreshSelectedProgram(selectedProgram.id);
            fetchAll();
            showToast('تمت إضافة المشاركين بنجاح');
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 3: CREATE / EDIT PROGRAM MODAL (With strict required validation)
      ────────────────────────────────────────────────────────────────────────── */}
      {createProgramModalOpen && (
        <ProgramFormModal
          program={editingProgram}
          categories={categories}
          templates={templates}
          onClose={() => {
            setCreateProgramModalOpen(false);
            setEditingProgram(null);
          }}
          onSuccess={(savedProg) => {
            setCreateProgramModalOpen(false);
            setEditingProgram(null);
            fetchAll();
            showToast(editingProgram?.id ? 'تم تعديل بيانات البرنامج بنجاح' : 'تم إنشاء البرنامج بنجاح');
            if (savedProg?.id) {
              openProgramDetails(savedProg.id);
            }
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 4: CREATE / EDIT TEMPLATE MODAL (With strict required validation)
      ────────────────────────────────────────────────────────────────────────── */}
      {createTemplateModalOpen && (
        <TemplateFormModal
          template={editingTemplate}
          categories={categories}
          onClose={() => {
            setCreateTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            setCreateTemplateModalOpen(false);
            setEditingTemplate(null);
            fetchAll();
            showToast(editingTemplate?.id ? 'تم تعديل القالب بنجاح' : 'تم إنشاء القالب بنجاح');
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          CONFIRM DELETE PROGRAM
      ────────────────────────────────────────────────────────────────────────── */}
      {deleteProgramConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">تأكيد حذف البرنامج</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف البرنامج &quot;{deleteProgramConfirm.title}&quot;؟ سيتم حذف بيانات المشاركين المسجلين في هذا البرنامج.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={async () => {
                  try {
                    await api.delete(`/educational/programs/${deleteProgramConfirm.id}`);
                    setDeleteProgramConfirm(null);
                    fetchAll();
                    showToast('تم حذف البرنامج بنجاح');
                  } catch (err) {
                    showToast('تعذر حذف البرنامج', 'error');
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteProgramConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          CONFIRM DELETE TEMPLATE
      ────────────────────────────────────────────────────────────────────────── */}
      {deleteTemplateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">تأكيد حذف القالب</h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من حذف قالب &quot;{deleteTemplateConfirm.title}&quot;؟
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={async () => {
                  try {
                    await api.delete(`/educational/templates/${deleteTemplateConfirm.id}`);
                    setDeleteTemplateConfirm(null);
                    fetchAll();
                    showToast('تم حذف القالب بنجاح');
                  } catch (err) {
                    showToast('تعذر حذف القالب', 'error');
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteTemplateConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENT: PROGRAM FORM MODAL (Create/Edit with Required Validation)
// ──────────────────────────────────────────────────────────────────────────────
function ProgramFormModal({ program, categories, templates, onClose, onSuccess }) {
  const isEdit = Boolean(program?.id);

  const [title, setTitle] = useState(program?.title || '');
  const [categoryId, setCategoryId] = useState(program?.category_id || categories[0]?.id || '');
  const [templateId, setTemplateId] = useState(program?.template_id || '');
  const [status, setStatus] = useState(program?.status || 'draft');
  const [location, setLocation] = useState(program?.location || '');
  const [startDate, setStartDate] = useState(formatDateInput(program?.start_date));
  const [endDate, setEndDate] = useState(formatDateInput(program?.end_date));
  const [totalSessions, setTotalSessions] = useState(program?.total_sessions || 12);
  const [targetCount, setTargetCount] = useState(program?.target_count || 25);
  const [instructorName, setInstructorName] = useState(program?.instructor_name || '');
  const [notes, setNotes] = useState(program?.notes || '');

  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // When picking a template, pre-populate values
  const handleTemplateChange = (tmplId) => {
    setTemplateId(tmplId);
    if (!tmplId) return;
    const selected = templates.find((t) => String(t.id) === String(tmplId));
    if (selected) {
      if (!title || title.trim() === '') setTitle(selected.title);
      if (selected.category_id) setCategoryId(selected.category_id);
      if (selected.default_sessions) setTotalSessions(selected.default_sessions);
      if (selected.description && (!notes || notes.trim() === '')) setNotes(selected.description);
      if (!startDate) {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        const end = new Date(Date.now() + (selected.default_duration_days || 14) * 86400000).toISOString().split('T')[0];
        setEndDate(end);
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'عنوان البرنامج مطلوب';
    if (!categoryId) errs.categoryId = 'يرجى اختيار التصنيف';
    if (!location.trim()) errs.location = 'موقع إقامة البرنامج مطلوب';
    if (!startDate) errs.startDate = 'تاريخ البدء مطلوب';
    if (!endDate) errs.endDate = 'تاريخ الانتهاء مطلوب';
    if (new Date(startDate) > new Date(endDate)) errs.endDate = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء';
    if (!totalSessions || parseInt(totalSessions, 10) < 1) errs.totalSessions = 'عدد الجلسات يجب أن يكون 1 على الأقل';
    if (!targetCount || parseInt(targetCount, 10) < 1) errs.targetCount = 'العدد المستهدف يجب أن يكون 1 على الأقل';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        categoryId: parseInt(categoryId, 10),
        templateId: templateId ? parseInt(templateId, 10) : null,
        status,
        location: location.trim(),
        startDate,
        endDate,
        totalSessions: parseInt(totalSessions, 10),
        targetCount: parseInt(targetCount, 10),
        instructorName: instructorName.trim() || null,
        notes: notes.trim() || null,
      };

      let res;
      if (isEdit) {
        res = await api.put(`/educational/programs/${program.id}`, payload);
      } else {
        res = await api.post('/educational/programs', payload);
      }

      onSuccess(res.data?.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'حدث خطأ أثناء حفظ البرنامج');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'تعديل بيانات البرنامج' : 'إضافة برنامج تربوي جديد'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                الحقول التي تحمل علامة (*) مطلوبة ولا يمكن الحفظ بدونها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Optional: Template selector */}
          {!isEdit && templates.length > 0 && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <label className="block text-xs font-bold text-indigo-900 mb-1">
                استيراد من قالب معتمد (اختياري)
              </label>
              <select
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— اختيار قالب أو إدخال يدوي —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category_name || 'عام'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Program Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان البرنامج التربوي / الدورة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دورة تدريبية في استخدام الذكاء الصناعي"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                formErrors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                التصنيف <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.categoryId
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              >
                <option value="">— اختر التصنيف —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.categoryId && <p className="text-xs text-rose-500 mt-1">{formErrors.categoryId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حالة البرنامج
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              >
                <option value="draft">مسودة</option>
                <option value="active">نشط ومستمر</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>

          {/* Location & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموقع / المركز / مكان الإقامة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: مركز علي بن ابي طالب أو مركز الاورام في تعز"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.location
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.location && <p className="text-xs text-rose-500 mt-1">{formErrors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم المدرب / المحاضر (اختياري)
              </label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="مثال: م. إبراهيم الصلوي"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
              />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ البدء <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.startDate
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.startDate && <p className="text-xs text-rose-500 mt-1">{formErrors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ الانتهاء <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.endDate
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.endDate && <p className="text-xs text-rose-500 mt-1">{formErrors.endDate}</p>}
            </div>
          </div>

          {/* Total Sessions & Target Orphans Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عدد الجلسات التدريبية <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.totalSessions
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.totalSessions && <p className="text-xs text-rose-500 mt-1">{formErrors.totalSessions}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العدد المستهدف من الأيتام <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.targetCount
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.targetCount && <p className="text-xs text-rose-500 mt-1">{formErrors.targetCount}</p>}
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف البرنامج وملاحظات إضافية
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أهداف الدورة أو الخطة أو ملاحظات المتابعة..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء البرنامج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENT: TEMPLATE FORM MODAL (Create/Edit with Required Validation)
// ──────────────────────────────────────────────────────────────────────────────
function TemplateFormModal({ template, categories, onClose, onSuccess }) {
  const isEdit = Boolean(template?.id);

  const [title, setTitle] = useState(template?.title || '');
  const [categoryId, setCategoryId] = useState(template?.category_id || categories[0]?.id || '');
  const [description, setDescription] = useState(template?.description || '');
  const [defaultDurationDays, setDefaultDurationDays] = useState(template?.default_duration_days || 14);
  const [defaultSessions, setDefaultSessions] = useState(template?.default_sessions || 10);
  const [targetAudience, setTargetAudience] = useState(template?.target_audience || 'الأيتام والطلاب');

  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'عنوان القالب مطلوب';
    if (!categoryId) errs.categoryId = 'يرجى اختيار التصنيف';
    if (!description.trim()) errs.description = 'وصف القالب مطلوب';
    if (!defaultDurationDays || parseInt(defaultDurationDays, 10) < 1) errs.defaultDurationDays = 'المدة يجب أن تكون يوماً واحداً على الأقل';
    if (!defaultSessions || parseInt(defaultSessions, 10) < 1) errs.defaultSessions = 'الجلسات يجب أن تكون 1 على الأقل';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        categoryId: parseInt(categoryId, 10),
        description: description.trim(),
        defaultDurationDays: parseInt(defaultDurationDays, 10),
        defaultSessions: parseInt(defaultSessions, 10),
        targetAudience: targetAudience.trim() || 'الأيتام والطلاب',
      };

      if (isEdit) {
        await api.put(`/educational/templates/${template.id}`, payload);
      } else {
        await api.post('/educational/templates', payload);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'حدث خطأ أثناء حفظ القالب');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'تعديل قالب البرنامج' : 'إنشاء قالب برنامج متكرر'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد مواصفات الدورة أو النشاط لإعادة استخدامها مستقبلاً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم القالب / الدورة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دورة مكثفة في حفظ القرآن الكريم"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                formErrors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              التصنيف <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                formErrors.categoryId
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
              }`}
            >
              <option value="">— اختر التصنيف —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {formErrors.categoryId && <p className="text-xs text-rose-500 mt-1">{formErrors.categoryId}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف القالب والمنهج <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="يتم فيها حفظ سورة البقرة وتجويد التلاوة وإتقان مخارج الحروف..."
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                formErrors.description
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
              }`}
            />
            {formErrors.description && <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>}
          </div>

          {/* Duration & Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المدة الافتراضية (بالأيام) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={defaultDurationDays}
                onChange={(e) => setDefaultDurationDays(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.defaultDurationDays
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.defaultDurationDays && (
                <p className="text-xs text-rose-500 mt-1">{formErrors.defaultDurationDays}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عدد الجلسات الافتراضية <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={defaultSessions}
                onChange={(e) => setDefaultSessions(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                  formErrors.defaultSessions
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]'
                }`}
              />
              {formErrors.defaultSessions && (
                <p className="text-xs text-rose-500 mt-1">{formErrors.defaultSessions}</p>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الفئة المستهدفة
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="مثال: الأيتام والطلاب المهتمون بالحفظ"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20 focus:border-[#1B5E8C]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء القالب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENT: ORPHAN SELECTOR MODAL (Add participants to program)
// ──────────────────────────────────────────────────────────────────────────────
function OrphanSelectorModal({ program, orphans, onClose, onSuccess }) {
  const [search, setSearch] = useState('');
  const [selectedOrphanIds, setSelectedOrphanIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Set of already enrolled orphan IDs
  const enrolledIds = useMemo(() => {
    return new Set((program.participants || []).map((p) => String(p.orphan_id)));
  }, [program.participants]);

  // Filter available orphans (excluding already enrolled)
  const availableOrphans = useMemo(() => {
    return orphans.filter((o) => {
      if (enrolledIds.has(String(o.id))) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const code = `orp-${o.id}`.toLowerCase();
        const name = (o.full_name || '').toLowerCase();
        const gov = (o.governorate_ar || o.governorate || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !gov.includes(q)) return false;
      }
      return true;
    });
  }, [orphans, enrolledIds, search]);

  const toggleSelect = (id) => {
    setSelectedOrphanIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrphanIds.length === availableOrphans.length) {
      setSelectedOrphanIds([]);
    } else {
      setSelectedOrphanIds(availableOrphans.map((o) => o.id));
    }
  };

  const handleEnroll = async () => {
    if (selectedOrphanIds.length === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/educational/programs/${program.id}/participants`, {
        orphanIds: selectedOrphanIds,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'حدث خطأ أثناء إضافة المشاركين');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#1B5E8C] rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                إضافة أيتام مشاركين في البرنامج
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                البرنامج: <span className="font-semibold text-[#1B5E8C]">{program.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Bulk Select */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B5E8C]/20"
            />
          </div>

          {availableOrphans.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
            >
              {selectedOrphanIds.length === availableOrphans.length ? 'إلغاء التحديد' : 'تحديد الكل'}
            </button>
          )}
        </div>

        {/* Orphans List */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {availableOrphans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              لا يوجد أيتام متاحون للإضافة حالياً.
            </div>
          ) : (
            availableOrphans.map((orphan) => {
              const isSelected = selectedOrphanIds.includes(orphan.id);
              const age = calcAge(orphan.date_of_birth);
              return (
                <div
                  key={orphan.id}
                  onClick={() => toggleSelect(orphan.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#1B5E8C]/40 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#1B5E8C] border-[#1B5E8C] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">{orphan.full_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        ORP-{String(orphan.id).padStart(6, '0')}
                        {age && <span className="mr-2 text-slate-600">({age} سنة)</span>}
                        {orphan.governorate_ar && (
                          <span className="mr-2 text-slate-600">— {orphan.governorate_ar}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-400">
                    {orphan.guardian_name ? `الوصي: ${orphan.guardian_name}` : ''}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            تم تحديد: <span className="font-bold text-[#1B5E8C]">{selectedOrphanIds.length}</span> يتيم
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleEnroll}
              disabled={selectedOrphanIds.length === 0 || submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl shadow-[0_2px_8px_rgba(27,94,140,0.25)] transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'جاري الإضافة...' : 'إضافة المحددين إلى البرنامج'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
