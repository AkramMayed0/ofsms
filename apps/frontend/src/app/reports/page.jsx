'use client';

/**
 * page.jsx
 * Route:  /reports  (GM only)
 * Task:   feature/ui-export-buttons
 *
 * Reports & Exports center for the General Manager:
 *   - Governorate Reports: PDF or Excel for all orphans in a governorate
 *   - Sponsor Reports: PDF or Excel for a sponsor's full portfolio
 *
 * API:
 *   GET /api/governorates              → list all governorates (for dropdown)
 *   GET /api/sponsors                  → list all sponsors (for dropdown)
 *   GET /api/reports/governorate/:id?format=pdf|excel → download file
 *   GET /api/reports/sponsor/:id?format=pdf|excel     → download file
 */

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Helpers ───────────────────────────────────────────────────────────────────

const downloadBlob = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
};

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="section-head">
      <div className="section-icon">{icon}</div>
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Format Picker ─────────────────────────────────────────────────────────────

function FormatPicker({ value, onChange }) {
  return (
    <div className="format-row">
      {[
        { val: 'pdf',   icon: '📄', label: 'PDF' },
        { val: 'excel', icon: '📊', label: 'Excel' },
      ].map(({ val, icon, label }) => (
        <button
          key={val}
          type="button"
          className={`format-btn ${value === val ? 'format-btn-active' : ''}`}
          onClick={() => onChange(val)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Governorate Report Card ───────────────────────────────────────────────────

function GovernorateReportCard({ governorates, loading }) {
  const [govId, setGovId]     = useState('');
  const [format, setFormat]   = useState('pdf');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const selectedGov = governorates.find(g => String(g.id) === govId);

  const handleExport = async () => {
    if (!govId) { setError('يرجى اختيار المحافظة أولاً'); return; }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const name     = selectedGov?.name_en || `gov-${govId}`;
      const date     = new Date().toISOString().split('T')[0];
      const filename = `governorate-${name}-${date}.${ext}`;
      await downloadBlob(`/api/reports/governorate/${govId}?format=${format}`, filename);
      setSuccess(`✅ تم تنزيل التقرير: ${filename}`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تنزيل التقرير. يرجى المحاولة مجدداً.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-card">
      <SectionHeader
        icon="🗺️"
        title="تقرير المحافظة"
        subtitle="تصدير بيانات جميع الأيتام في محافظة معينة مع معلومات الكفالة والمندوبين"
      />

      <div className="form-body">
        {/* Governorate select */}
        <div className="field-group">
          <label className="field-label">
            اختر المحافظة <span className="req">*</span>
          </label>
          {loading ? (
            <div className="inp-skel" />
          ) : (
            <select
              className={`inp sel ${!govId && error ? 'inp-err' : ''}`}
              value={govId}
              onChange={e => { setGovId(e.target.value); setError(''); }}
            >
              <option value="">-- اختر المحافظة --</option>
              {governorates.map(g => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
          )}
        </div>

        {/* Preview badge */}
        {selectedGov && (
          <div className="preview-badge">
            <span>🗺️</span>
            <span>{selectedGov.name_ar}</span>
            <span className="preview-sep">·</span>
            <span>{selectedGov.name_en}</span>
          </div>
        )}

        {/* Format */}
        <div className="field-group">
          <label className="field-label">تنسيق الملف</label>
          <FormatPicker value={format} onChange={setFormat} />
        </div>

        {/* What's included info */}
        <div className="info-box">
          <span className="info-icon">ℹ</span>
          <div className="info-text">
            يشمل التقرير: اسم اليتيم، الجنس، العمر، الحالة، الوصي، الكافل، المبلغ الشهري،
            تاريخ الكفالة، المندوب، وتاريخ التسجيل.
          </div>
        </div>

        {/* Feedback */}
        {error   && <div className="err-banner">⚠ {error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* Export button */}
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={busy || loading || !govId}
        >
          {busy
            ? <><span className="spin" /> جارٍ إنشاء التقرير…</>
            : format === 'pdf'
            ? <><span>📄</span> تنزيل PDF</>
            : <><span>📊</span> تنزيل Excel</>}
        </button>
      </div>
    </div>
  );
}

// ── Sponsor Report Card ───────────────────────────────────────────────────────

function SponsorReportCard({ sponsors, loading }) {
  const [sponsorId, setSponsorId] = useState('');
  const [format, setFormat]       = useState('pdf');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');

  const filteredSponsors = sponsors.filter(s =>
    !search ||
    s.full_name?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSponsor = sponsors.find(s => s.id === sponsorId);

  const handleExport = async () => {
    if (!sponsorId) { setError('يرجى اختيار الكافل أولاً'); return; }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const name     = selectedSponsor?.full_name?.replace(/\s+/g, '-') || sponsorId.slice(0, 8);
      const date     = new Date().toISOString().split('T')[0];
      const filename = `sponsor-${name}-${date}.${ext}`;
      await downloadBlob(`/api/reports/sponsor/${sponsorId}?format=${format}`, filename);
      setSuccess(`✅ تم تنزيل ملف الكافل: ${filename}`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل تنزيل التقرير. يرجى المحاولة مجدداً.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-card">
      <SectionHeader
        icon="🤝"
        title="تقرير الكافل"
        subtitle="تصدير محفظة كفالات كافل معين — الكفالات النشطة والتاريخية مع المبالغ"
      />

      <div className="form-body">
        {/* Search + select sponsors */}
        <div className="field-group">
          <label className="field-label">
            اختر الكافل <span className="req">*</span>
          </label>
          {loading ? (
            <div className="inp-skel" />
          ) : (
            <>
              <input
                className="inp"
                placeholder="ابحث بالاسم أو البريد…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="sponsor-list-box">
                {filteredSponsors.length === 0 ? (
                  <p className="sponsor-empty">لا توجد نتائج</p>
                ) : (
                  filteredSponsors.map(s => (
                    <div
                      key={s.id}
                      className={`sponsor-option ${sponsorId === s.id ? 'sponsor-selected' : ''}`}
                      onClick={() => { setSponsorId(s.id); setError(''); }}
                    >
                      <div className="sponsor-avatar">{s.full_name?.charAt(0) || '؟'}</div>
                      <div className="sponsor-info">
                        <div className="sponsor-name">{s.full_name}</div>
                        {s.email && <div className="sponsor-email">{s.email}</div>}
                      </div>
                      <div className="sponsor-count">
                        {s.active_sponsorships || 0} كفالة
                      </div>
                      {sponsorId === s.id && <span className="sponsor-check">✓</span>}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Preview */}
        {selectedSponsor && (
          <div className="preview-badge">
            <span>🤝</span>
            <span>{selectedSponsor.full_name}</span>
            <span className="preview-sep">·</span>
            <span>{selectedSponsor.active_sponsorships || 0} كفالة نشطة</span>
          </div>
        )}

        {/* Format */}
        <div className="field-group">
          <label className="field-label">تنسيق الملف</label>
          <FormatPicker value={format} onChange={setFormat} />
        </div>

        {/* Info */}
        <div className="info-box">
          <span className="info-icon">ℹ</span>
          <div className="info-text">
            يشمل التقرير: جميع الكفالات النشطة والتاريخية، نوع المستفيد، المحافظة، المندوب،
            المبلغ الشهري، تواريخ البداية والنهاية.
          </div>
        </div>

        {/* Feedback */}
        {error   && <div className="err-banner">⚠ {error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* Export button */}
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={busy || loading || !sponsorId}
        >
          {busy
            ? <><span className="spin" /> جارٍ إنشاء التقرير…</>
            : format === 'pdf'
            ? <><span>📄</span> تنزيل PDF</>
            : <><span>📊</span> تنزيل Excel</>}
        </button>
      </div>
    </div>
  );
}

// ── Quick Stats Bar ───────────────────────────────────────────────────────────

function QuickStats({ governorates, sponsors }) {
  return (
    <div className="quick-stats">
      <div className="qs-item">
        <span className="qs-num">{governorates.length}</span>
        <span className="qs-lbl">محافظة متاحة للتقارير</span>
      </div>
      <div className="qs-divider" />
      <div className="qs-item">
        <span className="qs-num">{sponsors.length}</span>
        <span className="qs-lbl">كافل مسجّل</span>
      </div>
      <div className="qs-divider" />
      <div className="qs-item">
        <span className="qs-num">2</span>
        <span className="qs-lbl">صيغ تصدير (PDF + Excel)</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [governorates, setGovernorates] = useState([]);
  const [sponsors,     setSponsors]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/governorates'),
      api.get('/sponsors'),
    ])
      .then(([govRes, sponsorRes]) => {
        setGovernorates(govRes.data.data || []);
        setSponsors(sponsorRes.data.sponsors || []);
      })
      .catch(() => setError('تعذّر تحميل البيانات الضرورية. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Page Header */}
        <div className="page-top">
          <div>
            <h1 className="page-title">📄 التقارير والتصدير</h1>
            <p className="page-sub">
              قم بتصدير بيانات النظام كملفات PDF أو Excel للمحافظات والكفلاء
            </p>
          </div>
        </div>

        {/* Quick stats */}
        {!loading && !error && (
          <QuickStats governorates={governorates} sponsors={sponsors} />
        )}

        {/* Global error */}
        {error && <div className="err-banner err-global">⚠ {error}</div>}

        {/* Report cards grid */}
        <div className="cards-grid">
          <GovernorateReportCard governorates={governorates} loading={loading} />
          <SponsorReportCard     sponsors={sponsors}         loading={loading} />
        </div>

        {/* Help section */}
        <div className="help-card">
          <h3 className="help-title">💡 معلومات عن التقارير</h3>
          <div className="help-grid">
            <div className="help-item">
              <span className="help-icon">📄</span>
              <div>
                <strong>PDF</strong>
                <p>مناسب للطباعة والمشاركة. يحتوي على جدول منسّق مع رأس وتذييل.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">📊</span>
              <div>
                <strong>Excel</strong>
                <p>مناسب للتحليل والفرز والتصفية. يدعم RTL ويحتوي على صف ملخص.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">🔒</span>
              <div>
                <strong>الخصوصية</strong>
                <p>التقارير متاحة للمدير العام فقط. يتم توليدها لحظياً من قاعدة البيانات.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-icon">📅</span>
              <div>
                <strong>التحديث</strong>
                <p>البيانات في التقارير حديثة دائماً — يتم سحبها مباشرة عند النقر على التنزيل.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── Page top ─────────────────────────────────────────────────── */
        .page-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .page-title { font-size: 1.65rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        /* ── Quick stats ──────────────────────────────────────────────── */
        .quick-stats {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          border-radius: 1rem;
          padding: 1.25rem 2rem;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .qs-item { display: flex; flex-direction: column; align-items: center; gap: .2rem; flex: 1; }
        .qs-num { font-size: 1.75rem; font-weight: 800; color: #fff; font-family: 'Cairo', sans-serif; }
        .qs-lbl { font-size: .75rem; color: rgba(255,255,255,.7); font-weight: 500; white-space: nowrap; }
        .qs-divider { width: 1px; align-self: stretch; background: rgba(255,255,255,.2); }

        /* ── Cards grid ───────────────────────────────────────────────── */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 800px) { .cards-grid { grid-template-columns: 1fr; } }

        /* ── Report card ──────────────────────────────────────────────── */
        .report-card {
          background: #fff;
          border: 1px solid #e5eaf0;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(27,94,140,.06);
        }

        /* ── Section header ───────────────────────────────────────────── */
        .section-head {
          display: flex;
          align-items: flex-start;
          gap: .85rem;
          padding: 1.25rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5eaf0;
        }
        .section-icon {
          width: 44px; height: 44px; border-radius: .75rem;
          background: #1B5E8C; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; flex-shrink: 0;
        }
        .section-title { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .section-sub { font-size: .78rem; color: #6b7a8d; margin: 0; line-height: 1.6; }

        /* ── Form body ────────────────────────────────────────────────── */
        .form-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        /* ── Field group ──────────────────────────────────────────────── */
        .field-group { display: flex; flex-direction: column; gap: .4rem; }
        .field-label { font-size: .82rem; font-weight: 600; color: #374151; }
        .req { color: #dc2626; }

        /* ── Input ────────────────────────────────────────────────────── */
        .inp {
          border: 1.5px solid #d1d5db; border-radius: .625rem;
          padding: .65rem .9rem; font-size: .88rem;
          font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; width: 100%; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color: #dc2626 !important; }
        .sel { appearance: none; cursor: pointer; }
        .inp-skel {
          height: 40px; border-radius: .625rem;
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Sponsor list box ─────────────────────────────────────────── */
        .sponsor-list-box {
          border: 1.5px solid #e5eaf0; border-radius: .625rem;
          max-height: 220px; overflow-y: auto; background: #fafafa; margin-top: .35rem;
        }
        .sponsor-empty { font-size: .82rem; color: #9ca3af; text-align: center; padding: 1.25rem; margin: 0; }
        .sponsor-option {
          display: flex; align-items: center; gap: .65rem;
          padding: .65rem .85rem; cursor: pointer; border-bottom: 1px solid #f0f4f8;
          transition: background .12s;
        }
        .sponsor-option:last-child { border-bottom: none; }
        .sponsor-option:hover { background: #f0f7ff; }
        .sponsor-selected { background: #eff6ff; }
        .sponsor-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: .85rem; font-weight: 700;
        }
        .sponsor-info { flex: 1; min-width: 0; }
        .sponsor-name { font-size: .85rem; font-weight: 600; color: #1f2937; }
        .sponsor-email { font-size: .73rem; color: #9ca3af; direction: ltr; text-align: left; }
        .sponsor-count { font-size: .75rem; font-weight: 700; color: #1B5E8C; white-space: nowrap; }
        .sponsor-check { color: #1B5E8C; font-weight: 800; font-size: 1rem; }

        /* ── Preview badge ────────────────────────────────────────────── */
        .preview-badge {
          display: inline-flex; align-items: center; gap: .5rem;
          background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: .5rem;
          padding: .45rem .85rem; font-size: .82rem; font-weight: 600; color: #1d4ed8;
        }
        .preview-sep { color: #93c5fd; }

        /* ── Format picker ────────────────────────────────────────────── */
        .format-row { display: flex; gap: .65rem; }
        .format-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: .5rem;
          padding: .65rem; border: 1.5px solid #e5eaf0; border-radius: .625rem;
          font-family: 'Cairo', sans-serif; font-size: .88rem; font-weight: 600;
          color: #6b7280; background: #fafafa; cursor: pointer; transition: all .15s;
        }
        .format-btn:hover { border-color: #1B5E8C; color: #1B5E8C; background: #f0f7ff; }
        .format-btn-active { border-color: #1B5E8C; background: #1B5E8C; color: #fff; }

        /* ── Info box ─────────────────────────────────────────────────── */
        .info-box {
          display: flex; align-items: flex-start; gap: .6rem;
          background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .625rem;
          padding: .75rem .9rem;
        }
        .info-icon { color: #2563eb; font-size: .9rem; flex-shrink: 0; margin-top: 1px; }
        .info-text { font-size: .78rem; color: #1d4ed8; line-height: 1.65; }

        /* ── Feedback banners ─────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .65rem .9rem; border-radius: .625rem; font-size: .82rem; font-weight: 500;
        }
        .err-global { border-radius: .875rem; padding: .85rem 1rem; font-size: .85rem; }
        .success-banner {
          background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;
          padding: .65rem .9rem; border-radius: .625rem; font-size: .82rem; font-weight: 600;
        }

        /* ── Export button ────────────────────────────────────────────── */
        .btn-export {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          width: 100%; padding: .85rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif;
          font-size: .95rem; font-weight: 700;
          border: none; border-radius: .75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-export:hover:not(:disabled) {
          background: linear-gradient(135deg, #2E7EB8, #1B5E8C);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(27,94,140,.35);
        }
        .btn-export:disabled { opacity: .55; cursor: not-allowed; transform: none; }

        /* ── Help card ────────────────────────────────────────────────── */
        .help-card {
          background: #f9fafb; border: 1px solid #e5eaf0; border-radius: 1.125rem;
          padding: 1.5rem 1.75rem;
        }
        .help-title { font-size: .92rem; font-weight: 800; color: #374151; margin: 0 0 1.1rem; }
        .help-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .help-grid { grid-template-columns: 1fr; } }
        .help-item { display: flex; align-items: flex-start; gap: .75rem; }
        .help-icon { font-size: 1.3rem; flex-shrink: 0; }
        .help-item strong { display: block; font-size: .85rem; font-weight: 700; color: #1f2937; margin-bottom: .2rem; }
        .help-item p { font-size: .78rem; color: #6b7280; margin: 0; line-height: 1.6; }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
}
