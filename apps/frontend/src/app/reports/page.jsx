'use client';

/**
 * page.jsx
 * Route:  /reports  (GM only)
 * Task:   feature/ui-export-buttons
 *
 * FIX APPLIED:
 * The `api` Axios instance has baseURL = process.env.NEXT_PUBLIC_API_URL
 * which is typically "http://localhost:4000/api".
 * So paths passed to api.get() must NOT include /api prefix.
 * Wrong: api.get('/api/reports/governorate/1')  → becomes .../api/api/reports/... → 404
 * Right: api.get('/reports/governorate/1')      → becomes .../api/reports/...    → 200
 */

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Download helper ───────────────────────────────────────────────────────────
// path must be relative to api baseURL, e.g. '/reports/governorate/1?format=pdf'
const downloadBlob = async (path, filename) => {
  const response = await api.get(path, { responseType: 'blob' });
  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

// ── Format Picker ─────────────────────────────────────────────────────────────
function FormatPicker({ value, onChange }) {
  return (
    <div className="format-row">
      {[
        { val: 'excel', icon: '📊', label: 'Excel (.xlsx)', hint: 'موصى به' },
        { val: 'pdf',   icon: '📄', label: 'PDF',           hint: 'للطباعة' },
      ].map(({ val, icon, label, hint }) => (
        <button
          key={val}
          type="button"
          className={`format-btn ${value === val ? 'format-btn-active' : ''}`}
          onClick={() => onChange(val)}
        >
          <span className="format-icon">{icon}</span>
          <span className="format-label">{label}</span>
          <span className="format-hint">{hint}</span>
        </button>
      ))}
    </div>
  );
}

// ── Governorate Report Card ───────────────────────────────────────────────────
function GovernorateReportCard({ governorates, loading }) {
  const [govId,   setGovId]   = useState('');
  const [format,  setFormat]  = useState('excel');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const selectedGov = governorates.find(g => String(g.id) === String(govId));

  const handleExport = async () => {
    if (!govId) { setError('يرجى اختيار المحافظة أولاً'); return; }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const nameSlug = selectedGov?.name_en?.replace(/\s+/g, '-') || `gov-${govId}`;
      const date     = new Date().toISOString().split('T')[0];
      const filename = `governorate-${nameSlug}-${date}.${ext}`;

      // ✅ FIXED: '/reports/...' not '/api/reports/...'
      // api instance baseURL already includes /api
      await downloadBlob(`/reports/governorate/${govId}?format=${format}`, filename);

      setSuccess(`تم تنزيل التقرير بنجاح: ${filename}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      // Try to extract error message from blob response
      let msg = 'فشل التنزيل. يرجى التحقق من الاتصال بالخادم.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed.error || msg;
        } catch { /* ignore */ }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="card-header-icon">🗺️</div>
        <div>
          <h2 className="card-title">تقرير المحافظة</h2>
          <p className="card-sub">بيانات الأيتام مع معلومات الكفالة والمندوبين</p>
        </div>
      </div>

      <div className="card-body">
        {/* Governorate select */}
        <div className="field-group">
          <label className="field-label">اختر المحافظة <span className="req">*</span></label>
          {loading ? (
            <div className="skel-inp" />
          ) : (
            <select
              className={`inp sel ${!govId && error ? 'inp-err' : ''}`}
              value={govId}
              onChange={e => { setGovId(e.target.value); setError(''); setSuccess(''); }}
            >
              <option value="">-- اختر المحافظة --</option>
              {governorates.map(g => (
                <option key={g.id} value={g.id}>{g.name_ar} ({g.name_en})</option>
              ))}
            </select>
          )}
        </div>

        {/* Selected preview */}
        {selectedGov && (
          <div className="selection-preview">
            <span className="preview-icon">🗺️</span>
            <span className="preview-name">{selectedGov.name_ar}</span>
            <span className="preview-sep">·</span>
            <span className="preview-en">{selectedGov.name_en}</span>
          </div>
        )}

        {/* Format */}
        <div className="field-group">
          <label className="field-label">تنسيق الملف</label>
          <FormatPicker value={format} onChange={setFormat} />
        </div>

        {/* What's included */}
        <div className="includes-box">
          <p className="includes-title">يشمل التقرير:</p>
          <div className="includes-chips">
            {['الاسم الكامل','الجنس','العمر','الحالة','الوصي','الكافل','المبلغ الشهري','المندوب','تاريخ التسجيل'].map(c => (
              <span key={c} className="chip">✓ {c}</span>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {error   && <div className="err-banner">⚠ {error}</div>}
        {success && <div className="ok-banner">✅ {success}</div>}

        {/* Export button */}
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={busy || loading || !govId}
        >
          {busy
            ? <><span className="spin" /> جارٍ إنشاء التقرير…</>
            : format === 'pdf'
            ? <>📄 تنزيل PDF</>
            : <>📊 تنزيل Excel</>}
        </button>
      </div>
    </div>
  );
}

// ── Sponsor Report Card ───────────────────────────────────────────────────────
function SponsorReportCard({ sponsors, loading }) {
  const [sponsorId, setSponsorId] = useState('');
  const [format,    setFormat]    = useState('excel');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [search,    setSearch]    = useState('');

  const filteredSponsors = sponsors.filter(s =>
    !search ||
    s.full_name?.includes(search) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const selectedSponsor = sponsors.find(s => s.id === sponsorId);

  const handleExport = async () => {
    if (!sponsorId) { setError('يرجى اختيار الكافل أولاً'); return; }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const nameSlug = selectedSponsor?.full_name?.replace(/\s+/g, '-') || sponsorId.slice(0, 8);
      const date     = new Date().toISOString().split('T')[0];
      const filename = `sponsor-${nameSlug}-${date}.${ext}`;

      // ✅ FIXED: '/reports/...' not '/api/reports/...'
      await downloadBlob(`/reports/sponsor/${sponsorId}?format=${format}`, filename);

      setSuccess(`تم تنزيل ملف الكافل بنجاح: ${filename}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      let msg = 'فشل التنزيل. يرجى التحقق من الاتصال بالخادم.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          msg = parsed.error || msg;
        } catch { /* ignore */ }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="report-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="card-header-icon">🤝</div>
        <div>
          <h2 className="card-title">تقرير الكافل</h2>
          <p className="card-sub">محفظة الكفالات النشطة والتاريخية مع كامل التفاصيل</p>
        </div>
      </div>

      <div className="card-body">
        {/* Sponsor search + select */}
        <div className="field-group">
          <label className="field-label">اختر الكافل <span className="req">*</span></label>
          {loading ? (
            <div className="skel-inp" />
          ) : (
            <>
              <input
                className="inp"
                placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني…"
                value={search}
                onChange={e => { setSearch(e.target.value); setSponsorId(''); setError(''); }}
              />
              <div className="sponsor-list">
                {filteredSponsors.length === 0 ? (
                  <p className="sponsor-empty">
                    {sponsors.length === 0
                      ? 'لا يوجد كفلاء مسجّلون في النظام بعد'
                      : 'لا توجد نتائج مطابقة'}
                  </p>
                ) : filteredSponsors.map(s => (
                  <div
                    key={s.id}
                    className={`sponsor-row ${sponsorId === s.id ? 'sponsor-row-active' : ''}`}
                    onClick={() => { setSponsorId(s.id); setError(''); setSuccess(''); }}
                  >
                    <div className="sponsor-av">{s.full_name?.charAt(0) || '؟'}</div>
                    <div className="sponsor-info">
                      <span className="sponsor-name">{s.full_name}</span>
                      {s.email && <span className="sponsor-email">{s.email}</span>}
                    </div>
                    <span className="sponsor-count">{s.active_sponsorships || 0} كفالة</span>
                    {sponsorId === s.id && <span className="sponsor-check">✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Selected preview */}
        {selectedSponsor && (
          <div className="selection-preview">
            <span className="preview-icon">🤝</span>
            <span className="preview-name">{selectedSponsor.full_name}</span>
            <span className="preview-sep">·</span>
            <span className="preview-en">{selectedSponsor.active_sponsorships || 0} كفالة نشطة</span>
          </div>
        )}

        {/* Format */}
        <div className="field-group">
          <label className="field-label">تنسيق الملف</label>
          <FormatPicker value={format} onChange={setFormat} />
        </div>

        {/* What's included */}
        <div className="includes-box">
          <p className="includes-title">يشمل التقرير:</p>
          <div className="includes-chips">
            {['الكفالات النشطة','الكفالات التاريخية','نوع المستفيد','المحافظة','المندوب','المبلغ الشهري','تاريخ البداية والنهاية'].map(c => (
              <span key={c} className="chip">✓ {c}</span>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {error   && <div className="err-banner">⚠ {error}</div>}
        {success && <div className="ok-banner">✅ {success}</div>}

        {/* Export button */}
        <button
          className="btn-export"
          onClick={handleExport}
          disabled={busy || loading || !sponsorId}
        >
          {busy
            ? <><span className="spin" /> جارٍ إنشاء التقرير…</>
            : format === 'pdf'
            ? <>📄 تنزيل PDF</>
            : <>📊 تنزيل Excel</>}
        </button>
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
    Promise.all([
      api.get('/governorates'),
      api.get('/sponsors'),
    ])
      .then(([govRes, sponsorRes]) => {
        setGovernorates(govRes.data.data || []);
        setSponsors(sponsorRes.data.sponsors || []);
      })
      .catch(() => setError('تعذّر تحميل البيانات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">📄 التقارير والتصدير</h1>
            <p className="page-sub">
              قم بتصدير بيانات النظام كملفات PDF أو Excel للمحافظات والكفلاء
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && !error && (
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">{governorates.length}</span>
              <span className="stat-lbl">محافظة</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">{sponsors.length}</span>
              <span className="stat-lbl">كافل مسجّل</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">2</span>
              <span className="stat-lbl">صيغ تصدير (PDF + Excel)</span>
            </div>
          </div>
        )}

        {/* Global error */}
        {error && <div className="err-banner err-global">⚠ {error}</div>}

        {/* Cards */}
        <div className="cards-grid">
          <GovernorateReportCard governorates={governorates} loading={loading} />
          <SponsorReportCard     sponsors={sponsors}         loading={loading} />
        </div>

        {/* Help */}
        <div className="help-card">
          <h3 className="help-title">💡 نصائح حول التصدير</h3>
          <div className="help-grid">
            <div className="help-item">
              <span>📊</span>
              <div>
                <strong>Excel (موصى به)</strong>
                <p>يدعم الفرز والتصفية وعمليات البيانات. النص العربي يُعرض بشكل صحيح مع دعم RTL.</p>
              </div>
            </div>
            <div className="help-item">
              <span>📄</span>
              <div>
                <strong>PDF</strong>
                <p>مناسب للطباعة والمشاركة. قد يظهر النص العربي بخطوط محدودة (بدون تشكيل).</p>
              </div>
            </div>
            <div className="help-item">
              <span>🔒</span>
              <div>
                <strong>الصلاحيات</strong>
                <p>هذه التقارير متاحة للمدير العام فقط. جميع البيانات مباشرة من قاعدة البيانات.</p>
              </div>
            </div>
            <div className="help-item">
              <span>⚡</span>
              <div>
                <strong>البيانات حديثة دائماً</strong>
                <p>لا يوجد كاش — يتم توليد التقرير لحظياً عند الضغط على زر التنزيل.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        /* ── Layout ───────────────────────────────────────────────────── */
        .page {
          max-width: 1100px; margin: 0 auto; padding-bottom: 4rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          display: flex; flex-direction: column; gap: 1.5rem;
        }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .page-title { font-size: 1.65rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .2rem; }
        .page-sub { font-size: .85rem; color: #6b7a8d; margin: 0; }

        /* ── Stats bar ────────────────────────────────────────────────── */
        .stats-bar {
          display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
          background: linear-gradient(135deg, #0d3d5c, #1B5E8C);
          border-radius: 1rem; padding: 1.25rem 2rem;
        }
        .stat { display: flex; flex-direction: column; align-items: center; gap: .2rem; flex: 1; }
        .stat-num { font-size: 1.75rem; font-weight: 800; color: #fff; }
        .stat-lbl { font-size: .75rem; color: rgba(255,255,255,.7); font-weight: 500; white-space: nowrap; }
        .stat-div { width: 1px; align-self: stretch; background: rgba(255,255,255,.2); }

        /* ── Global error ─────────────────────────────────────────────── */
        .err-global { border-radius: .875rem; padding: .85rem 1rem; font-size: .85rem; }

        /* ── Cards grid ───────────────────────────────────────────────── */
        .cards-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;
        }
        @media (max-width: 820px) { .cards-grid { grid-template-columns: 1fr; } }

        /* ── Report card ──────────────────────────────────────────────── */
        .report-card {
          background: #fff; border: 1px solid #e5eaf0; border-radius: 1.25rem;
          overflow: hidden; box-shadow: 0 2px 12px rgba(27,94,140,.07);
        }
        .card-header {
          display: flex; align-items: center; gap: .85rem;
          padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e5eaf0;
        }
        .card-header-icon {
          width: 46px; height: 46px; border-radius: .75rem; background: #1B5E8C;
          display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;
        }
        .card-title { font-size: 1rem; font-weight: 800; color: #0d3d5c; margin: 0 0 .15rem; }
        .card-sub { font-size: .78rem; color: #6b7a8d; margin: 0; }
        .card-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }

        /* ── Fields ───────────────────────────────────────────────────── */
        .field-group { display: flex; flex-direction: column; gap: .4rem; }
        .field-label { font-size: .82rem; font-weight: 600; color: #374151; }
        .req { color: #dc2626; }
        .inp {
          border: 1.5px solid #d1d5db; border-radius: .625rem; padding: .65rem .9rem;
          font-size: .88rem; font-family: 'Cairo', sans-serif; color: #1f2937;
          background: #fafafa; outline: none; width: 100%; box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .inp:focus { border-color: #1B5E8C; background: #fff; box-shadow: 0 0 0 3px rgba(27,94,140,.1); }
        .inp-err { border-color: #dc2626 !important; }
        .sel { appearance: none; cursor: pointer; }
        .skel-inp {
          height: 42px; border-radius: .625rem;
          background: linear-gradient(90deg, #f0f4f8 25%, #e5eaf0 50%, #f0f4f8 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite;
        }

        /* ── Sponsor list ─────────────────────────────────────────────── */
        .sponsor-list {
          border: 1.5px solid #e5eaf0; border-radius: .625rem;
          max-height: 200px; overflow-y: auto; background: #fafafa; margin-top: .35rem;
        }
        .sponsor-empty { font-size: .82rem; color: #9ca3af; text-align: center; padding: 1.25rem; margin: 0; }
        .sponsor-row {
          display: flex; align-items: center; gap: .65rem;
          padding: .6rem .85rem; cursor: pointer; border-bottom: 1px solid #f0f4f8;
          transition: background .12s;
        }
        .sponsor-row:last-child { border-bottom: none; }
        .sponsor-row:hover { background: #f0f7ff; }
        .sponsor-row-active { background: #eff6ff; }
        .sponsor-av {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #1B5E8C, #0d3d5c);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: .85rem; font-weight: 700;
        }
        .sponsor-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .1rem; }
        .sponsor-name { font-size: .85rem; font-weight: 600; color: #1f2937; }
        .sponsor-email { font-size: .72rem; color: #9ca3af; direction: ltr; text-align: left; }
        .sponsor-count { font-size: .75rem; font-weight: 700; color: #1B5E8C; white-space: nowrap; flex-shrink: 0; }
        .sponsor-check { color: #1B5E8C; font-weight: 800; }

        /* ── Selection preview ────────────────────────────────────────── */
        .selection-preview {
          display: inline-flex; align-items: center; gap: .5rem;
          background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: .5rem;
          padding: .45rem .85rem; font-size: .82rem; font-weight: 600; color: #1d4ed8;
        }
        .preview-icon { font-size: 1rem; }
        .preview-name { font-weight: 700; color: #0d3d5c; }
        .preview-sep { color: #93c5fd; }
        .preview-en { color: #6b7a8d; font-size: .78rem; }

        /* ── Format picker ────────────────────────────────────────────── */
        .format-row { display: flex; gap: .65rem; }
        .format-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: .2rem;
          padding: .75rem; border: 1.5px solid #e5eaf0; border-radius: .75rem;
          font-family: 'Cairo', sans-serif; background: #fafafa; cursor: pointer; transition: all .15s;
        }
        .format-btn:hover { border-color: #1B5E8C; background: #f0f7ff; }
        .format-btn-active { border-color: #1B5E8C; background: #1B5E8C; }
        .format-icon { font-size: 1.4rem; }
        .format-label { font-size: .82rem; font-weight: 700; color: #374151; }
        .format-btn-active .format-label { color: #fff; }
        .format-hint { font-size: .7rem; color: #9ca3af; }
        .format-btn-active .format-hint { color: rgba(255,255,255,.7); }

        /* ── Includes box ─────────────────────────────────────────────── */
        .includes-box {
          background: #f8fafc; border: 1px solid #e5eaf0; border-radius: .625rem; padding: .85rem;
        }
        .includes-title { font-size: .75rem; font-weight: 700; color: #6b7a8d; margin: 0 0 .5rem; }
        .includes-chips { display: flex; flex-wrap: wrap; gap: .35rem; }
        .chip {
          font-size: .7rem; font-weight: 600; padding: .2rem .55rem;
          background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 2rem;
        }

        /* ── Feedback ─────────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          padding: .65rem .9rem; border-radius: .625rem; font-size: .82rem; font-weight: 500;
        }
        .ok-banner {
          background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46;
          padding: .65rem .9rem; border-radius: .625rem; font-size: .82rem; font-weight: 600;
        }

        /* ── Export button ────────────────────────────────────────────── */
        .btn-export {
          display: flex; align-items: center; justify-content: center; gap: .5rem;
          width: 100%; padding: .9rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff; font-family: 'Cairo', sans-serif; font-size: .95rem; font-weight: 700;
          border: none; border-radius: .75rem; cursor: pointer;
          box-shadow: 0 2px 8px rgba(27,94,140,.25); transition: all .15s;
        }
        .btn-export:hover:not(:disabled) {
          background: linear-gradient(135deg, #2E7EB8, #1B5E8C);
          transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,94,140,.35);
        }
        .btn-export:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        /* ── Help card ────────────────────────────────────────────────── */
        .help-card {
          background: #f9fafb; border: 1px solid #e5eaf0; border-radius: 1.125rem;
          padding: 1.5rem 1.75rem;
        }
        .help-title { font-size: .92rem; font-weight: 800; color: #374151; margin: 0 0 1.1rem; }
        .help-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .help-grid { grid-template-columns: 1fr; } }
        .help-item { display: flex; align-items: flex-start; gap: .75rem; }
        .help-item span { font-size: 1.3rem; flex-shrink: 0; }
        .help-item strong { display: block; font-size: .85rem; font-weight: 700; color: #1f2937; margin-bottom: .2rem; }
        .help-item p { font-size: .78rem; color: #6b7280; margin: 0; line-height: 1.6; }

        /* ── Spinner / shimmer ────────────────────────────────────────── */
        .spin {
          display: inline-block; width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
          border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>
    </AppShell>
  );
}
