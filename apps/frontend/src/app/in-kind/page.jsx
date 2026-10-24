'use client';

/**
 * /in-kind/page.jsx
 * برامج الدعم والمساعدات العينية — مؤسسة نماء التنموية الخيرية
 *
 * Features:
 *   - Custom elevated design matching OFSMS design system
 *   - Switchable tabs: البرامج والمشاريع / أنواع وتصنيفات الدعم
 *   - Program management: Create, Filter (status, type, sponsor), Search, Detail View
 *   - Orphan & Sponsor attribution: Assign orphan to in-kind program and specify funding sponsor
 *   - Delivery recording: Mark delivered with recipient name, relation, and date
 *   - Types & Units management: Add / remove aid types (e.g., سلال غذائية، كسوة عيد، تمور...)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Search, Filter, Calendar, Users, Handshake, CheckCircle2,
  Clock, Tag, Trash2, Edit3, X, ChevronDown, Check, AlertCircle, ArrowRight,
  Sparkles, Layers, Box, Info, HeartHandshake, Eye, UserCheck, ShieldCheck,
  Send, RefreshCw, UserPlus, FileSpreadsheet, Building2
} from 'lucide-react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';
import useAuthStore from '../../store/useAuthStore';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('ar-YE', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return String(d);
  }
};

const STATUS_CONFIG = {
  active: {
    label: 'نشط ومستمر',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'مكتمل وموزع',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  draft: {
    label: 'مسودة تخطيط',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
};

const KINSHIP_OPTIONS = [
  { value: 'أم', label: 'أم' },
  { value: 'أب', label: 'أب' },
  { value: 'أخ', label: 'أخ' },
  { value: 'أخت', label: 'أخت' },
  { value: 'عم', label: 'عم (أخ الأب)' },
  { value: 'عمة', label: 'عمة (أخت الأب)' },
  { value: 'خال', label: 'خال (أخ الأم)' },
  { value: 'خالة', label: 'خالة (أخت الأم)' },
  { value: 'جد', label: 'جد' },
  { value: 'جدة', label: 'جدة' },
  { value: 'ابن عم / قريب', label: 'ابن عم / قريب' },
  { value: 'وصي شرعي', label: 'وصي شرعي / كافل قانوني' },
  { value: 'زوج الأم / زوجة الأب', label: 'زوج الأم / زوجة الأب' },
  { value: 'أخرى', label: 'صلة قرابة أخرى' },
];

const normalizeKinship = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim().toLowerCase();
  const map = {
    maternal_uncle: 'خال',
    maternal_aunt: 'خالة',
    uncle: 'عم',
    paternal_uncle: 'عم',
    paternal_aunt: 'عمة',
    mother: 'أم',
    father: 'أب',
    grandfather: 'جد',
    grandmother: 'جدة',
    sibling: 'أخ',
    brother: 'أخ',
    sister: 'أخت',
    guardian: 'وصي شرعي',
    legal_guardian: 'وصي شرعي',
    other: 'أخرى',
  };
  return map[trimmed] || val;
};

export default function InKindPage() {
  const { user } = useAuthStore();
  const isGM = user?.role === 'gm';
  const isSupervisor = user?.role === 'supervisor';
  const isStaff = ['gm', 'supervisor', 'agent', 'finance'].includes(user?.role);

  // Top Tabs: 'programs' | 'types'
  const [activeTab, setActiveTab] = useState('programs');

  // Core Data
  const [programs, setPrograms] = useState([]);
  const [types, setTypes] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters for programs tab
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sponsorFilter, setSponsorFilter] = useState('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [beneficiaryToDeliver, setBeneficiaryToDeliver] = useState(null);
  const [deleteProgramConfirm, setDeleteProgramConfirm] = useState(null);

  // Show Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // ── Fetch Initial Data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [progRes, typesRes, sponsorsRes, orphansRes] = await Promise.allSettled([
        api.get('/in-kind/programs'),
        api.get('/in-kind/types'),
        api.get('/sponsors'),
        api.get('/orphans'),
      ]);

      if (progRes.status === 'fulfilled' && progRes.value.data?.data) {
        setPrograms(progRes.value.data.data);
      }
      if (typesRes.status === 'fulfilled' && typesRes.value.data?.data) {
        setTypes(typesRes.value.data.data);
      }
      if (sponsorsRes.status === 'fulfilled' && sponsorsRes.value.data?.sponsors) {
        setSponsors(sponsorsRes.value.data.sponsors);
      }
      if (orphansRes.status === 'fulfilled' && orphansRes.value.data?.orphans) {
        setOrphans(orphansRes.value.data.orphans);
      }
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل بيانات الدعم العيني');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Load single program details (including beneficiaries list)
  const openProgramDetails = async (programId) => {
    try {
      const res = await api.get(`/in-kind/programs/${programId}`);
      if (res.data?.data) {
        setSelectedProgram(res.data.data);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      showToast('تعذر جلب تفاصيل البرنامج والمستفيدين', 'error');
    }
  };

  // Refresh current program details when changes happen
  const refreshCurrentProgram = async (programId) => {
    try {
      const [res, allProgRes] = await Promise.all([
        api.get(`/in-kind/programs/${programId}`),
        api.get('/in-kind/programs'),
      ]);
      if (res.data?.data) setSelectedProgram(res.data.data);
      if (allProgRes.data?.data) setPrograms(allProgRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Filtered Programs ───────────────────────────────────────────────────────
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && String(p.type_id) !== String(typeFilter)) return false;
      if (sponsorFilter !== 'all' && p.sponsor_id !== sponsorFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchNotes = (p.notes || '').toLowerCase().includes(q);
        const matchType = (p.type_name || '').toLowerCase().includes(q);
        const matchSponsor = (p.sponsor_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchType && !matchSponsor) return false;
      }
      return true;
    });
  }, [programs, statusFilter, typeFilter, sponsorFilter, search]);

  // ── Overall Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalProg = programs.length;
    const activeProg = programs.filter((p) => p.status === 'active').length;
    const totalBeneficiaries = programs.reduce((acc, p) => acc + (parseInt(p.beneficiary_count, 10) || 0), 0);
    const totalDelivered = programs.reduce((acc, p) => acc + (parseInt(p.delivered_count, 10) || 0), 0);
    const overallRate = totalBeneficiaries > 0 ? Math.round((totalDelivered / totalBeneficiaries) * 100) : 0;
    return { totalProg, activeProg, totalBeneficiaries, totalDelivered, overallRate };
  }, [programs]);

  return (
    <AppShell>
      <div className="space-y-6">

        {/* ── Toast Notification ────────────────────────────────────────── */}
        {toast && (
          <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-[#1B5E8C] text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ── Top Hero & Page Header ──────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-l from-[#134569] via-[#1B5E8C] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-[#1B5E8C]/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 border border-white/20 text-xs font-medium mb-3 backdrop-blur-sm">
                <Box size={14} className="text-blue-200" />
                <span>منظومة الرعاية الشاملة</span>
                <span className="w-1 h-1 rounded-full bg-blue-300" />
                <span>مؤسسة نماء التنموية الخيرية</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                برامج ومشاريع الدعم العيني
              </h1>
              <p className="text-blue-100/80 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                إدارة حملات ومشاريع المساعدات العينية (السلال الغذائية، كسوة العيد، الحقيبة المدرسية، والمواد الإغاثية)
                مع توثيق ربط كل يتيم بالكافل أو الجهة المانحة ومتابعة التسليم الميداني بدقة.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
                className="!bg-white hover:!bg-blue-50 !text-[#1B5E8C] font-bold shadow-lg shadow-black/20 !rounded-xl !py-3 !px-5"
              >
                <Plus size={18} />
                <span>برنامج دعم جديد</span>
              </Button>
            </div>
          </div>

          {/* Background Decorative Rings */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ── Summary Stat Pills ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex items-center gap-4 transition hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center flex-shrink-0">
              <Package size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">إجمالي البرامج</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{stats.totalProg}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex items-center gap-4 transition hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">المشاريع النشطة</p>
              <h3 className="text-xl sm:text-2xl font-black text-[#1B5E8C] mt-0.5">{stats.activeProg}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex items-center gap-4 transition hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">الأيتام والمستفيدون</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{stats.totalBeneficiaries}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm flex items-center gap-4 transition hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">تم التسليم والتغطية</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-blue-700">{stats.totalDelivered}</h3>
                <span className="text-xs font-bold text-gray-400">({stats.overallRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Tab Switcher ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                activeTab === 'programs'
                  ? 'bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white shadow-md shadow-[#1B5E8C]/20'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Package size={17} />
              <span>البرامج والمشاريع ({programs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                activeTab === 'types'
                  ? 'bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white shadow-md shadow-[#1B5E8C]/20'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Layers size={17} />
              <span>أنواع وتصنيفات الدعم ({types.length})</span>
            </button>
          </div>

          <button
            onClick={fetchAll}
            title="تحديث البيانات"
            className="p-2 text-gray-500 hover:text-[#1B5E8C] hover:bg-blue-50 rounded-xl transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: البرامج والمشاريع العينية
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'programs' && (
          <div className="space-y-6">

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم البرنامج، نوع الدعم، أو اسم الكافل..."
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط ومستمر</option>
                <option value="completed">مكتمل</option>
                <option value="draft">مسودة</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer"
              >
                <option value="all">جميع أنواع الدعم</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </select>

              {/* Sponsor Filter */}
              <select
                value={sponsorFilter}
                onChange={(e) => setSponsorFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">جميع الكفلاء والداعمين</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Programs Cards Grid */}
            {loading && programs.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Spinner size="lg" variant="primary" />
                <p className="text-sm font-medium">جارٍ تحميل برامج الدعم العيني...</p>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center mx-auto">
                  <Package size={30} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">لا توجد برامج تطابق خيارات البحث</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  يمكنك تغيير فلاتر البحث أو إنشاء برنامج دعم ومساعدة عينية جديد وتعيين الأيتام والكفلاء الداعمين له.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setCreateModalOpen(true)}
                  className="!rounded-xl !px-6"
                >
                  <Plus size={16} />
                  <span>إنشاء أول برنامج دعم عيني</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrograms.map((prog) => {
                  const cfg = STATUS_CONFIG[prog.status] || STATUS_CONFIG.active;
                  const isDeliveredFull = prog.coverage_percent === 100 && prog.beneficiary_count > 0;

                  return (
                    <div
                      key={prog.id}
                      className="group bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative"
                    >
                      {/* Top status & type banner */}
                      <div className="p-5 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                            <Tag size={12} className="text-gray-500" />
                            {prog.type_name || 'دعم عيني'}
                            {prog.type_unit && <span className="text-gray-400">({prog.type_unit})</span>}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#1B5E8C] transition line-clamp-2">
                          {prog.title}
                        </h3>

                        {/* Execution period */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                          <Calendar size={13} className="text-gray-400" />
                          <span>الفترة: {fmtDate(prog.start_date)} — {fmtDate(prog.end_date)}</span>
                        </div>
                      </div>

                      {/* Sponsor / Donor Attribution Card Highlight */}
                      <div className="mx-5 mb-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Handshake size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            الجهة المانحة / الكافل الداعم
                          </p>
                          <p className="text-xs font-extrabold text-amber-950 truncate mt-0.5">
                            {prog.sponsor_name ? prog.sponsor_name : 'فاعل خير / دعم عام من المؤسسة'}
                          </p>
                        </div>
                      </div>

                      {/* Progress and Numbers */}
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 mt-auto">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users size={13} />
                            المستفيدون المعينون:
                            <strong className="text-gray-900 mr-1">{prog.beneficiary_count || 0}</strong>
                          </span>
                          <span className="text-[#1B5E8C] font-extrabold">
                            تم تسليم: {prog.delivered_count || 0} ({prog.coverage_percent || 0}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isDeliveredFull ? 'bg-emerald-600' : 'bg-[#1B5E8C]'
                            }`}
                            style={{ width: `${Math.min(prog.coverage_percent || 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-3 px-5 border-t border-gray-100 bg-white flex items-center justify-between gap-2">
                        <button
                          onClick={() => openProgramDetails(prog.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:from-[#2E7EB8] hover:to-[#1B5E8C] text-white text-xs font-bold rounded-xl transition shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
                        >
                          <Eye size={15} />
                          <span>عرض التفاصيل والمستفيدين</span>
                        </button>

                        {isGM && (
                          <button
                            onClick={() => setDeleteProgramConfirm(prog)}
                            title="حذف البرنامج"
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: أنواع وتصنيفات الدعم العيني
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'types' && (
          <InKindTypesTab
            types={types}
            isStaff={isStaff}
            onTypeCreated={fetchAll}
            onTypeDeleted={fetchAll}
            showToast={showToast}
          />
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: إنشاء برنامج دعم عيني جديد
      ══════════════════════════════════════════════════════════════════════ */}
      {createModalOpen && (
        <CreateProgramModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          types={types}
          sponsors={sponsors}
          onCreated={() => {
            setCreateModalOpen(false);
            fetchAll();
            showToast('تم إنشاء برنامج الدعم العيني بنجاح');
          }}
          showToast={showToast}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: تفاصيل البرنامج وقائمة المستفيدين (Orphans & Sponsors)
      ══════════════════════════════════════════════════════════════════════ */}
      {detailsModalOpen && selectedProgram && (
        <ProgramDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedProgram(null);
          }}
          program={selectedProgram}
          isStaff={isStaff}
          onOpenAssign={() => setAssignModalOpen(true)}
          onOpenDeliver={(beneficiary) => {
            setBeneficiaryToDeliver(beneficiary);
            setDeliverModalOpen(true);
          }}
          onRefresh={() => refreshCurrentProgram(selectedProgram.id)}
          showToast={showToast}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 3: تعيين يتيم للمشروع وتحديد الكافل الداعم (Orphan & Sponsor)
      ══════════════════════════════════════════════════════════════════════ */}
      {assignModalOpen && selectedProgram && (
        <AssignBeneficiaryModal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          program={selectedProgram}
          orphans={orphans}
          sponsors={sponsors}
          onAssigned={() => {
            setAssignModalOpen(false);
            refreshCurrentProgram(selectedProgram.id);
            showToast('تم تعيين الأيتام للمشروع بنجاح وتوثيق الكفلاء الداعمين');
          }}
          showToast={showToast}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 4: توثيق وتأكيد استلام المساعدة العينية
      ══════════════════════════════════════════════════════════════════════ */}
      {deliverModalOpen && beneficiaryToDeliver && selectedProgram && (
        <MarkDeliveryModal
          open={deliverModalOpen}
          onClose={() => {
            setDeliverModalOpen(false);
            setBeneficiaryToDeliver(null);
          }}
          beneficiary={beneficiaryToDeliver}
          program={selectedProgram}
          onDelivered={() => {
            setDeliverModalOpen(false);
            setBeneficiaryToDeliver(null);
            refreshCurrentProgram(selectedProgram.id);
            showToast('تم تسجيل استلام المساعدة بنجاح');
          }}
          showToast={showToast}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 5: تأكيد حذف برنامج
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteProgramConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={26} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">حذف برنامج الدعم العيني؟</h3>
              <p className="text-sm text-gray-600 mt-1">
                هل أنت متأكد من رغبتك في حذف برنامج <strong>"{deleteProgramConfirm.title}"</strong>؟ سيتم حذف جميع تعيينات المستفيدين المرتبطة به.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteProgramConfirm(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.delete(`/in-kind/programs/${deleteProgramConfirm.id}`);
                    setDeleteProgramConfirm(null);
                    fetchAll();
                    showToast('تم حذف البرنامج بنجاح');
                  } catch (err) {
                    showToast('تعذر حذف البرنامج', 'error');
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-rose-600/30"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: تبويب أنواع وتصنيفات الدعم العيني (Types Management)
// ─────────────────────────────────────────────────────────────────────────────
function InKindTypesTab({ types, isStaff, onTypeCreated, onTypeDeleted, showToast }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('سلة');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم نوع الدعم', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/in-kind/types', { name: name.trim(), unit: unit.trim() || 'قطعة' });
      setName('');
      setUnit('سلة');
      onTypeCreated();
      showToast('تمت إضافة نوع الدعم بنجاح');
    } catch (err) {
      showToast(err.response?.data?.error || 'تعذر إضافة نوع الدعم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, programCount) => {
    if (programCount > 0) {
      showToast(`لا يمكن حذف هذا النوع لوجود ${programCount} مشروع مرتبط به`, 'error');
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/in-kind/types/${id}`);
      onTypeDeleted();
      showToast('تم حذف نوع الدعم بنجاح');
    } catch (err) {
      showToast('تعذر حذف نوع الدعم', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Quick Add Form */}
      {isStaff && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B5E8C] flex items-center justify-center">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">إضافة نوع دعم عيني جديد</h3>
              <p className="text-xs text-gray-500">حدد المسمى ووحدة القياس المستخدمة عند التوزيع (سلة، طقم، كجم، حقيبة...)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم نوع الدعم (مثال: السلال الغذائية، كسوة العيد، الحقيبة المدرسية...)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition"
              />
            </div>

            <div className="w-full sm:w-48">
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="وحدة القياس (مثال: سلة، طقم، حقيبة، كجم)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition"
              />
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full sm:w-auto !rounded-xl !py-2.5 !px-6"
            >
              <Plus size={16} />
              <span>إضافة النوع</span>
            </Button>
          </form>
        </div>
      )}

      {/* Grid of types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {types.map((t) => {
          const count = parseInt(t.program_count, 10) || 0;
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between gap-3 hover:border-[#1B5E8C]/40 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center flex-shrink-0 font-bold">
                  <Box size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{t.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                      وحدة: {t.unit || 'قطعة'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {count} مشروع
                    </span>
                  </div>
                </div>
              </div>

              {isStaff && (
                <button
                  onClick={() => handleDelete(t.id, count)}
                  disabled={deletingId === t.id}
                  title="حذف هذا النوع"
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Modal إنشاء برنامج دعم عيني جديد
// ─────────────────────────────────────────────────────────────────────────────
function CreateProgramModal({ open, onClose, types, sponsors, onCreated, showToast }) {
  const [title, setTitle] = useState('');
  const [typeId, setTypeId] = useState(types[0]?.id || '');
  const [sponsorId, setSponsorId] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(10);
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (types.length > 0 && !typeId) {
      setTypeId(types[0].id);
    }
  }, [types, typeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) {
      errs.title = 'عنوان البرنامج مطلوب';
    }
    if (!typeId) {
      errs.typeId = 'نوع الدعم مطلوب';
    }
    if (!startDate) {
      errs.startDate = 'تاريخ بدء التوزيع مطلوب';
    }
    if (!targetQuantity || parseInt(targetQuantity, 10) <= 0) {
      errs.targetQuantity = 'العدد المستهدف يجب أن يكون 1 على الأقل';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('يرجى ملء جميع الحقول المطلوبة قبل الحفظ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/in-kind/programs', {
        title: title.trim(),
        typeId: typeId ? parseInt(typeId, 10) : null,
        sponsorId: sponsorId || null,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        targetQuantity: parseInt(targetQuantity, 10) || 0,
        notes: notes.trim() || null,
      });
      onCreated();
    } catch (err) {
      showToast(err.response?.data?.error || 'تعذر إنشاء البرنامج', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">إنشاء برنامج دعم عيني جديد</h2>
              <p className="text-xs text-gray-500">مشروع توزيع سلال غذائية، كسوة، أو مساعدات عينية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Program Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              عنوان البرنامج / المشروع <span className="text-rose-500 font-black">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFieldErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="مثال: مشروع توزيع السلال الغذائية لشهر رمضان"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition ${
                fieldErrors.title ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Type & Sponsor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                نوع الدعم العيني <span className="text-rose-500 font-black">*</span>
              </label>
              <select
                required
                value={typeId}
                onChange={(e) => {
                  setTypeId(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, typeId: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                  fieldErrors.typeId ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (وحدة: {t.unit})
                  </option>
                ))}
              </select>
              {fieldErrors.typeId && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.typeId}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الكافل الداعم للمشروع (الجهة المانحة)
              </label>
              <select
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer"
              >
                <option value="">فاعل خير / تمويل متعدد من المؤسسة</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.phone || 'بدون هاتف'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Target Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">حالة المشروع</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer"
              >
                <option value="active">نشط ومستمر للتوزيع</option>
                <option value="draft">مسودة قيد التجهيز</option>
                <option value="completed">مكتمل ومغلق</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                العدد المستهدف (الحصص) <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetQuantity}
                onChange={(e) => {
                  setTargetQuantity(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, targetQuantity: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition ${
                  fieldErrors.targetQuantity ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              />
              {fieldErrors.targetQuantity && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.targetQuantity}</span>
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                تاريخ بدء التوزيع <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                  fieldErrors.startDate ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              />
              {fieldErrors.startDate && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.startDate}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ انتهاء التوزيع</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">ملاحظات وشروط التوزيع</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مخصص لأيتام أمانة العاصمة ومحافظة صنعاء الأكثر احتياجاً..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <Button
              type="submit"
              loading={submitting}
              className="!py-2.5 !px-6 !rounded-xl"
            >
              <Plus size={16} />
              <span>إنشاء البرنامج</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Modal تفاصيل البرنامج والمستفيدين (Details & Beneficiaries List)
// ─────────────────────────────────────────────────────────────────────────────
function ProgramDetailsModal({
  open,
  onClose,
  program,
  isStaff,
  onOpenAssign,
  onOpenDeliver,
  onRefresh,
  showToast,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [deletingBeneficiaryId, setDeletingBeneficiaryId] = useState(null);

  const beneficiaries = program.beneficiaries || [];

  const filteredBeneficiaries = useMemo(() => {
    if (!filterQuery.trim()) return beneficiaries;
    const q = filterQuery.trim().toLowerCase();
    return beneficiaries.filter((b) => {
      const matchName = (b.orphan_name || b.family_name || '').toLowerCase().includes(q);
      const matchCode = (b.orphan_code || '').toLowerCase().includes(q);
      const matchSponsor = (b.sponsor_name || '').toLowerCase().includes(q);
      const matchReceiver = (b.receiver_name || '').toLowerCase().includes(q);
      return matchName || matchCode || matchSponsor || matchReceiver;
    });
  }, [beneficiaries, filterQuery]);

  const handleRemoveBeneficiary = async (beneficiaryId) => {
    if (!confirm('هل أنت متأكد من إزالة هذا المستفيد من البرنامج؟')) return;
    setDeletingBeneficiaryId(beneficiaryId);
    try {
      await api.delete(`/in-kind/beneficiaries/${beneficiaryId}`);
      onRefresh();
      showToast('تمت إزالة المستفيد من البرنامج');
    } catch (err) {
      showToast('تعذر إزالة المستفيد', 'error');
    } finally {
      setDeletingBeneficiaryId(null);
    }
  };

  const cfg = STATUS_CONFIG[program.status] || STATUS_CONFIG.active;

  return (
    <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col" dir="rtl">

        {/* Modal Top Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">{program.title}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              الفترة: {fmtDate(program.start_date)} — {fmtDate(program.end_date)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <p className="text-xs font-semibold text-gray-500">نوع الدعم والوحدة</p>
            <p className="text-base font-extrabold text-gray-900 mt-1">
              {program.type_name || 'دعم عيني'}
              {program.type_unit && <span className="text-xs text-gray-500 font-medium mr-1">({program.type_unit})</span>}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <p className="text-xs font-bold text-amber-800">الكافل / الجهة المانحة</p>
            <p className="text-sm font-black text-amber-950 mt-1 truncate">
              {program.sponsor_name || 'تمويل عام من المؤسسة'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <p className="text-xs font-semibold text-gray-500">الأيتام المستهدفون</p>
            <p className="text-base font-extrabold text-gray-900 mt-1">
              {program.beneficiary_count || 0} <span className="text-xs text-gray-400 font-normal">مستفيد</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80">
            <p className="text-xs font-bold text-[#1B5E8C]">تم التسليم ونسبة الإنجاز</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-base font-black text-[#134569]">
                {program.delivered_count || 0}
              </p>
              <span className="text-xs font-bold text-[#1B5E8C]">({program.coverage_percent || 0}%)</span>
            </div>
          </div>
        </div>

        {/* Beneficiaries Section Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <Users size={17} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                الفئة المستهدفة وقائمة الأيتام الموزع لهم ({beneficiaries.length})
              </h3>
              <p className="text-xs text-gray-500">الأيتام المعينون والكفلاء الداعمون لكل حصة وحالة الاستلام</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStaff && (
              <Button
                variant="primary"
                onClick={onOpenAssign}
                className="!bg-gradient-to-br from-[#1B5E8C] to-[#134569] hover:!from-[#2E7EB8] hover:!to-[#1B5E8C] text-white !rounded-xl !py-2 !px-4 text-xs font-bold shadow-[0_2px_8px_rgba(27,94,140,0.25)]"
              >
                <UserPlus size={16} />
                <span>+ تعيين أيتام للمشروع</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search within beneficiaries */}
        <div className="relative">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="بحث بكود اليتيم، الاسم، أو الكافل الداعم..."
            className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition"
          />
        </div>

        {/* Beneficiaries Table */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-2xl shadow-inner min-h-[220px]">
          {filteredBeneficiaries.length === 0 ? (
            <div className="py-14 text-center text-gray-400 space-y-2">
              <Users size={32} className="mx-auto text-gray-300" />
              <p className="text-sm font-semibold">لم يتم تعيين أي أيتام في هذا البرنامج حتى الآن</p>
              {isStaff && (
                <button
                  onClick={onOpenAssign}
                  className="text-xs text-[#1B5E8C] hover:underline font-bold mt-1 inline-block"
                >
                  اضغط هنا لاختيار وتعيين الأيتام وتحديد الكافل الداعم
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">كود اليتيم</th>
                  <th className="py-3 px-4">اسم اليتيم / المستفيد</th>
                  <th className="py-3 px-4">الكافل المانح (الداعم)</th>
                  <th className="py-3 px-4">المستلم وطريقة التسليم</th>
                  <th className="py-3 px-4">تاريخ الاستلام</th>
                  <th className="py-3 px-4 text-center">حالة الاستلام</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredBeneficiaries.map((b) => {
                  const isDelivered = b.status === 'delivered';

                  return (
                    <tr key={b.beneficiary_id} className="hover:bg-gray-50/80 transition">
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-600 whitespace-nowrap">
                        {b.orphan_code || 'ORP-000000'}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{b.orphan_name || b.family_name || 'يتيم'}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            يتيم
                          </span>
                        </div>
                        {b.guardian_name && (
                          <p className="text-[11px] text-gray-400 mt-0.5">ولي الأمر: {b.guardian_name}</p>
                        )}
                      </td>

                      {/* Sponsor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[#1B5E8C] font-bold">
                          <HeartHandshake size={14} className="text-[#1B5E8C] flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{b.sponsor_name || 'فاعل خير / دعم عام'}</span>
                        </div>
                      </td>

                      {/* Receiver */}
                      <td className="py-3 px-4">
                        <div className="text-gray-900">
                          {b.receiver_name ? (
                            <span>
                              {b.receiver_name} {b.receiver_relation ? `(${normalizeKinship(b.receiver_relation)})` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">بانتظار التسليم</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {b.delivery_method || 'من المقر'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-mono">
                        {fmtDate(b.delivered_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <Check size={12} />
                            تم الاستلام
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock size={12} />
                            قيد الانتظار
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onOpenDeliver(b)}
                            title={isDelivered ? 'تعديل بيانات الاستلام' : 'تسجيل وتأكيد الاستلام'}
                            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isDelivered
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-[#1B5E8C] hover:bg-[#134569] text-white shadow-sm'
                            }`}
                          >
                            <UserCheck size={14} />
                            <span>{isDelivered ? 'تعديل' : 'تسليم'}</span>
                          </button>

                          {isStaff && (
                            <button
                              onClick={() => handleRemoveBeneficiary(b.beneficiary_id)}
                              disabled={deletingBeneficiaryId === b.beneficiary_id}
                              title="إزالة من البرنامج"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Modal تعيين يتيم وتحديد الكافل الداعم (Assign Orphan & Sponsor)
// ─────────────────────────────────────────────────────────────────────────────
function AssignBeneficiaryModal({ open, onClose, program, orphans, sponsors, onAssigned, showToast }) {
  const [selectedOrphanId, setSelectedOrphanId] = useState('');
  const [selectedSponsorId, setSelectedSponsorId] = useState(program.sponsor_id || '');
  const [deliveryMethod, setDeliveryMethod] = useState('من المقر');
  const [receiverName, setReceiverName] = useState('');
  const [receiverRelation, setReceiverRelation] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [notes, setNotes] = useState('');
  const [orphanSearch, setOrphanSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // When orphan changes, pre-fill receiver with guardian if known
  const handleOrphanChange = (orphanId) => {
    setSelectedOrphanId(orphanId);
    setFieldErrors((prev) => ({ ...prev, orphan: '' }));
    const orphan = orphans.find((o) => o.id === orphanId);
    if (orphan) {
      if (orphan.guardian_name) {
        setReceiverName(orphan.guardian_name);
        setFieldErrors((prev) => ({ ...prev, receiverName: '' }));
      }
      if (orphan.guardian_relation) {
        const norm = normalizeKinship(orphan.guardian_relation);
        setReceiverRelation(norm);
        setFieldErrors((prev) => ({ ...prev, receiverRelation: '' }));
      }
    }
  };

  // Filter orphans by search
  const filteredOrphans = useMemo(() => {
    if (!orphanSearch.trim()) return orphans.slice(0, 50);
    const q = orphanSearch.trim().toLowerCase();
    return orphans.filter((o) => {
      const matchName = (o.full_name || '').toLowerCase().includes(q);
      const matchGuardian = (o.guardian_name || '').toLowerCase().includes(q);
      const matchId = String(o.id).toLowerCase().includes(q);
      return matchName || matchGuardian || matchId;
    }).slice(0, 50);
  }, [orphans, orphanSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selectedOrphanId) {
      errs.orphan = 'يرجى اختيار اليتيم المستفيد';
    }
    if (!receiverName.trim()) {
      errs.receiverName = 'اسم المستلم مطلوب ولا يمكن تركه فارغاً';
    }
    const finalRelation = receiverRelation === 'أخرى' && customRelation.trim() ? customRelation.trim() : receiverRelation;
    if (!finalRelation.trim()) {
      errs.receiverRelation = 'يرجى اختيار صلة القرابة باليتيم';
    }
    if (!deliveryMethod.trim()) {
      errs.deliveryMethod = 'طريقة التسليم مطلوبة';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('يرجى استكمال جميع الحقول الإلزامية المطلوبة أولاً', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/in-kind/programs/${program.id}/beneficiaries`, {
        beneficiaries: [
          {
            orphanId: selectedOrphanId,
            sponsorId: selectedSponsorId || null,
            deliveryMethod,
            receiverName: receiverName.trim(),
            receiverRelation: finalRelation.trim(),
            notes: notes.trim() || null,
          },
        ],
      });
      onAssigned();
    } catch (err) {
      showToast(err.response?.data?.error || 'تعذر تعيين المستفيد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-6" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">تعيين يتيم وتحديد الكافل الداعم</h3>
              <p className="text-xs text-gray-500">مشروع: {program.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Search & Select Orphan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اختر اليتيم المستفيد <span className="text-rose-500 font-black">*</span>
            </label>
            <div className="mb-2 relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={orphanSearch}
                onChange={(e) => setOrphanSearch(e.target.value)}
                placeholder="تصفية قائمة الأيتام بالاسم أو الكود..."
                className="w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white"
              />
            </div>
            <select
              required
              value={selectedOrphanId}
              onChange={(e) => handleOrphanChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                fieldErrors.orphan ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
              }`}
            >
              <option value="">-- اضغط لاختيار اليتيم من القائمة (مطلوب) --</option>
              {filteredOrphans.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name} {o.guardian_name ? `(ولي الأمر: ${o.guardian_name})` : ''}
                </option>
              ))}
            </select>
            {fieldErrors.orphan && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{fieldErrors.orphan}</span>
              </p>
            )}
          </div>

          {/* 2. Select Sponsor (Who funds this orphan's package) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <HeartHandshake size={16} className="text-amber-700" />
              <span>الكافل / الجهة المانحة لهذه الحصة</span>
            </div>
            <select
              value={selectedSponsorId}
              onChange={(e) => setSelectedSponsorId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-amber-600 transition cursor-pointer"
            >
              <option value="">
                {program.sponsor_name
                  ? `الكافل الافتراضي للمشروع: ${program.sponsor_name}`
                  : 'فاعل خير / دعم عام من المؤسسة'}
              </option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.phone || 'بدون هاتف'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-amber-800/80">
              يمكنك ربط هذه الحصة بكافل خاص باليتيم، أو اعتماد الكافل المموّل للمشروع ككل.
            </p>
          </div>

          {/* 3. Delivery Method */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              طريقة ومقر التسليم <span className="text-rose-500 font-black">*</span>
            </label>
            <select
              required
              value={deliveryMethod}
              onChange={(e) => {
                setDeliveryMethod(e.target.value);
                setFieldErrors((prev) => ({ ...prev, deliveryMethod: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                fieldErrors.deliveryMethod ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
              }`}
            >
              <option value="من المقر">استلام مباشر من مقر المؤسسة</option>
              <option value="توصيل للمنزل">توصيل إلى منزل الأسرة</option>
              <option value="نقطة توزيع">تسليم عبر نقطة توزيع معتمدة</option>
              <option value="مندوب ميداني">تسليم عبر مندوب المنطقة</option>
            </select>
            {fieldErrors.deliveryMethod && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{fieldErrors.deliveryMethod}</span>
              </p>
            )}
          </div>

          {/* 4. Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                اسم المستلم المتوقع <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => {
                  setReceiverName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, receiverName: '' }));
                }}
                placeholder="اسم ولي الأمر أو الوصي"
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition ${
                  fieldErrors.receiverName ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              />
              {fieldErrors.receiverName && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.receiverName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                صلة القرابة باليتيم <span className="text-rose-500 font-black">*</span>
              </label>
              <select
                required
                value={receiverRelation}
                onChange={(e) => {
                  setReceiverRelation(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, receiverRelation: '' }));
                }}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                  fieldErrors.receiverRelation ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- اختر صلة القرابة --</option>
                {KINSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.receiverRelation && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.receiverRelation}</span>
                </p>
              )}
            </div>
          </div>

          {/* If "أخرى" is chosen, show a custom relation input */}
          {receiverRelation === 'أخرى' && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                حدد صلة القرابة <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="text"
                value={customRelation}
                onChange={(e) => setCustomRelation(e.target.value)}
                placeholder="مثال: زوج الأخت، الجارة المتبنية..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white"
              />
            </div>
          )}

          {/* 5. Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات إضافية</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بتسليم هذا اليتيم..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <Button
              type="submit"
              loading={submitting}
              className="!py-2 !px-5 !rounded-xl text-xs"
            >
              <Check size={15} />
              <span>تأكيد التعيين</span>
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Modal توثيق استلام المساعدة العينية (Mark Delivery)
// ─────────────────────────────────────────────────────────────────────────────
function MarkDeliveryModal({ open, onClose, beneficiary, program, onDelivered, showToast }) {
  const [receiverName, setReceiverName] = useState(beneficiary.receiver_name || beneficiary.guardian_name || '');
  const [receiverRelation, setReceiverRelation] = useState(
    normalizeKinship(beneficiary.receiver_relation || beneficiary.guardian_relation) || 'أم'
  );
  const [customRelation, setCustomRelation] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(beneficiary.delivery_method || 'من المقر');
  const [deliveredAt, setDeliveredAt] = useState(
    beneficiary.delivered_at
      ? new Date(beneficiary.delivered_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(beneficiary.notes || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!receiverName.trim()) {
      errs.receiverName = 'اسم المستلم الفعلي مطلوب';
    }
    const finalRelation = receiverRelation === 'أخرى' && customRelation.trim() ? customRelation.trim() : receiverRelation;
    if (!finalRelation.trim()) {
      errs.receiverRelation = 'يرجى تحديد صلة القرابة';
    }
    if (!deliveredAt) {
      errs.deliveredAt = 'تاريخ الاستلام مطلوب';
    }
    if (!deliveryMethod) {
      errs.deliveryMethod = 'طريقة ومقر الاستلام مطلوبة';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('يرجى ملء جميع الحقول المطلوبة قبل الحفظ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/in-kind/beneficiaries/${beneficiary.beneficiary_id}/deliver`, {
        status: 'delivered',
        deliveredAt,
        receiverName: receiverName.trim(),
        receiverRelation: finalRelation.trim(),
        deliveryMethod,
        notes: notes.trim() || null,
      });
      onDelivered();
    } catch (err) {
      showToast(err.response?.data?.error || 'تعذر تسجيل الاستلام', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1B5E8C] flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">توثيق تسليم المساعدة العينية</h3>
              <p className="text-xs text-gray-500">اليتيم: {beneficiary.orphan_name || 'يتيم'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اسم المستلم الفعلي <span className="text-rose-500 font-black">*</span>
            </label>
            <input
              type="text"
              required
              value={receiverName}
              onChange={(e) => {
                setReceiverName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, receiverName: '' }));
              }}
              placeholder="الاسم الثلاثي أو الرباعي للمستلم"
              className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition ${
                fieldErrors.receiverName ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
              }`}
            />
            {fieldErrors.receiverName && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{fieldErrors.receiverName}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                صلة القرابة <span className="text-rose-500 font-black">*</span>
              </label>
              <select
                required
                value={receiverRelation}
                onChange={(e) => {
                  setReceiverRelation(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, receiverRelation: '' }));
                }}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white transition cursor-pointer ${
                  fieldErrors.receiverRelation ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              >
                <option value="">-- اختر صلة القرابة --</option>
                {KINSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.receiverRelation && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.receiverRelation}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                تاريخ الاستلام <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="date"
                required
                value={deliveredAt}
                onChange={(e) => {
                  setDeliveredAt(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, deliveredAt: '' }));
                }}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white cursor-pointer ${
                  fieldErrors.deliveredAt ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
                }`}
              />
              {fieldErrors.deliveredAt && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.deliveredAt}</span>
                </p>
              )}
            </div>
          </div>

          {receiverRelation === 'أخرى' && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                حدد صلة القرابة <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="text"
                value={customRelation}
                onChange={(e) => setCustomRelation(e.target.value)}
                placeholder="صلة القرابة الفردية..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              طريقة ومقر الاستلام <span className="text-rose-500 font-black">*</span>
            </label>
            <select
              required
              value={deliveryMethod}
              onChange={(e) => {
                setDeliveryMethod(e.target.value);
                setFieldErrors((prev) => ({ ...prev, deliveryMethod: '' }));
              }}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white cursor-pointer ${
                fieldErrors.deliveryMethod ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500' : 'border-gray-200'
              }`}
            >
              <option value="من المقر">استلام مباشر من مقر المؤسسة</option>
              <option value="توصيل للمنزل">توصيل لمنزل الأسرة</option>
              <option value="نقطة توزيع">تسليم عبر مركز التوزيع المعتمد</option>
              <option value="مندوب ميداني">تسليم عبر مندوب المنطقة</option>
            </select>
            {fieldErrors.deliveryMethod && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={12} />
                <span>{fieldErrors.deliveryMethod}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات التوثيق</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم التأكد من الهوية واستلام سلة غذائية كاملة"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#1B5E8C] focus:ring-2 focus:ring-[#1B5E8C]/20 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              إلغاء
            </button>
            <Button
              type="submit"
              loading={submitting}
              className="!py-2 !px-5 !rounded-xl text-xs"
            >
              <Check size={15} />
              <span>تأكيد وحفظ الاستلام</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
