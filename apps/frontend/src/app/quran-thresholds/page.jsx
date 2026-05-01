'use client';

/**
 * page.jsx
 * Route:  /quran-thresholds  (GM only)
 * API:    GET /api/quran-thresholds        → load all thresholds
 *         PUT /api/quran-thresholds/:id    → update a single threshold
 *
 * Lets the GM view and edit the age-based Quran memorization thresholds.
 * Each row is independently editable with inline save + visual feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import AppShell from '../../components/AppShell';

// ── Max age in the system (for the visual bar) ────────────────────────────────
const MAX_AGE = 99;

// ── Age range visual bar ──────────────────────────────────────────────────────
function AgeBar({ ageMin, ageMax }) {
  const left  = (ageMin / MAX_AGE) * 100;
  const width = ((ageMax - ageMin) / MAX_AGE) * 100;
  return (
    <div className="age-bar-track" title={`${ageMin} – ${ageMax} سنة`}>
      <div
        className="age-bar-fill"
        style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
      />
    </div>
  );
}

// ── Save state indicator ──────────────────────────────────────────────────────
function SaveIndicator({ state }) {
  if (state === 'idle')    return null;
  if (state === 'saving')  return <span className="save-saving">جارٍ الحفظ…</span>;
  if (state === 'saved')   return <span className="save-done">✓ تم الحفظ</span>;
  if (state === 'error')   return <span className="save-err">✕ فشل الحفظ</span>;
  return null;
}

// ── Threshold row (independently editable) ────────────────────────────────────
function ThresholdRow({ threshold, index }) {
  const [form, setForm]       = useState({
    age_min:           threshold.age_min,
    age_max:           threshold.age_max,
    min_juz_per_month: threshold.min_juz_per_month,
    label:             threshold.label || '',
  });
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [dirty, setDirty]         = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    if (saveState !== 'idle') setSaveState('idle');
  };

  const handleSave = useCallback(async () => {
    setSaveState('saving');
    try {
      await api.put(`/quran-thresholds/${threshold.id}`, {
        age_min:           parseInt(form.age_min),
        age_max:           parseInt(form.age_max),
        min_juz_per_month: parseFloat(form.min_juz_per_month),
        label:             form.label.trim() || null,
      });
      setSaveState('saved');
      setDirty(false);
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  }, [form, threshold.id]);

  const handleReset = () => {
    setForm({
      age_min:           threshold.age_min,
      age_max:           threshold.age_max,
      min_juz_per_month: threshold.min_juz_per_month,
      label:             threshold.label || '',
    });
    setDirty(false);
    setSaveState('idle');
  };

  const isValid =
    parseInt(form.age_min) >= 0 &&
    parseInt(form.age_max) > parseInt(form.age_min) &&
    parseFloat(form.min_juz_per_month) > 0;

  return (
    <div
      className={`threshold-row ${dirty ? 'row-dirty' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Index badge ── */}
      <div className="row-index">{index + 1}</div>

      {/* ── Fields ── */}
      <div className="row-fields">

        {/* Label */}
        <div className="field-group">
          <label className="field-label">التسمية</label>
          <input
            className="field-input"
            value={form.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="مثال: أطفال صغار (5-9)"
          />
        </div>

        {/* Age range */}
        <div className="field-group field-age">
          <label className="field-label">الفئة العمرية (سنة)</label>
          <div className="age-inputs">
            <input
              className="field-input age-inp"
              type="number"
              min={0}
              max={98}
              value={form.age_min}
              onChange={(e) => handleChange('age_min', e.target.value)}
              placeholder="من"
            />
            <span className="age-sep">—</span>
            <input
              className="field-input age-inp"
              type="number"
              min={1}
              max={99}
              value={form.age_max}
              onChange={(e) => handleChange('age_max', e.target.value)}
              placeholder="إلى"
            />
          </div>
          <AgeBar ageMin={parseInt(form.age_min) || 0} ageMax={parseInt(form.age_max) || 0} />
        </div>

        {/* Min juz */}
        <div className="field-group field-juz">
          <label className="field-label">الحد الأدنى للحفظ (جزء/شهر)</label>
          <div className="juz-wrap">
            <input
              className="field-input juz-inp"
              type="number"
              min={0}
              step={0.25}
              value={form.min_juz_per_month}
              onChange={(e) => handleChange('min_juz_per_month', e.target.value)}
            />
            <span className="juz-unit">جزء</span>
          </div>
          {/* Visual juz scale */}
          <div className="juz-scale">
            {[0.25, 0.5, 1, 1.5, 2].map((v) => (
              <button
                key={v}
                type="button"
                className={`juz-preset ${parseFloat(form.min_juz_per_month) === v ? 'juz-preset-active' : ''}`}
                onClick={() => handleChange('min_juz_per_month', v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Actions ── */}
      <div className="row-actions">
        <SaveIndicator state={saveState} />
        {dirty && (
          <button className="btn-reset" onClick={handleReset} title="تراجع عن التغييرات">
            ↺
          </button>
        )}
        <button
          className={`btn-save ${!dirty || !isValid ? 'btn-save-disabled' : ''}`}
          onClick={handleSave}
          disabled={!dirty || !isValid || saveState === 'saving'}
        >
          {saveState === 'saving' ? (
            <span className="spin" />
          ) : (
            'حفظ'
          )}
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow({ index }) {
  return (
    <div className="threshold-row sk-row" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="row-index sk-num" />
      <div className="row-fields">
        {[220, 160, 130].map((w, i) => (
          <div key={i} className="field-group">
            <div className="sk-label" />
            <div className="sk-input" style={{ width: w }} />
          </div>
        ))}
      </div>
      <div className="row-actions">
        <div className="sk-btn" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QuranThresholdsPage() {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/quran-thresholds')
      .then((res) => setThresholds(res.data.thresholds || []))
      .catch(() => setError('تعذّر تحميل الإعدادات. يرجى تحديث الصفحة.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="page" dir="rtl">

        {/* ── Page header ── */}
        <div className="page-top">
          <div className="page-top-text">
            <h1 className="page-title">إعدادات حفظ القرآن</h1>
            <p className="page-sub">
              حدّد الحد الأدنى لعدد الأجزاء المطلوبة شهرياً لكل فئة عمرية.
              يُستخدم هذا الإعداد عند مراجعة تقارير الحفظ لتحديد الاستحقاق المالي.
            </p>
          </div>
          <div className="quran-icon" aria-hidden="true">📖</div>
        </div>

        {/* ── Info banner ── */}
        <div className="info-banner">
          <span className="info-icon">ℹ</span>
          <p>
            عند رفع تقرير الحفظ، يقارن النظام تلقائياً عدد الأجزاء المحفوظة بالحد الأدنى المقابل لعمر اليتيم.
            إذا لم يُستوفَ الحد → يُوقَف الصرف لذلك الشهر فقط مع بقاء الكفالة سارية.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="err-banner">⚠ {error}</div>
        )}

        {/* ── Thresholds list ── */}
        <div className="thresholds-card">
          <div className="card-header">
            <span className="card-title">الفئات العمرية</span>
            <span className="card-hint">
              {loading ? '…' : `${thresholds.length} فئات`}
            </span>
          </div>

          <div className="thresholds-list">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} index={i} />)
              : thresholds.length === 0
              ? (
                <div className="empty-state">
                  <span>📋</span>
                  <p>لا توجد فئات محددة بعد</p>
                </div>
              )
              : thresholds.map((t, i) => (
                  <ThresholdRow key={t.id} threshold={t} index={i} />
                ))
            }
          </div>
        </div>

        {/* ── Help section ── */}
        <div className="help-card">
          <h3 className="help-title">كيف تعمل هذه الإعدادات؟</h3>
          <div className="help-grid">
            <div className="help-item">
              <span className="help-num">١</span>
              <div>
                <strong>المندوب يرفع التقرير</strong>
                <p>يُدخل عدد الأجزاء المحفوظة لكل يتيم في نهاية الشهر.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-num">٢</span>
              <div>
                <strong>النظام يحسب العمر</strong>
                <p>يُحدد الفئة العمرية للطفل ويستخرج الحد الأدنى المقابل من هذه القائمة.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-num">٣</span>
              <div>
                <strong>المشرف يراجع ويقرر</strong>
                <p>يرى الحد الأدنى بجانب التقرير ويقرر القبول أو الرفض.</p>
              </div>
            </div>
            <div className="help-item">
              <span className="help-num">٤</span>
              <div>
                <strong>الأثر المالي</strong>
                <p>القبول → يُصرف المبلغ. الرفض → يُوقف صرف هذا الشهر فقط.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        /* ── Page ─────────────────────────────────────────────────────── */
        .page {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-family: 'Cairo', 'Tajawal', sans-serif;
          padding-bottom: 3rem;
        }

        /* ── Page top ─────────────────────────────────────────────────── */
        .page-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .page-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0d3d5c;
          margin: 0 0 0.35rem;
        }
        .page-sub {
          font-size: 0.83rem;
          color: #6b7280;
          margin: 0;
          max-width: 580px;
          line-height: 1.7;
        }
        .quran-icon {
          font-size: 2.8rem;
          flex-shrink: 0;
          opacity: 0.6;
        }

        /* ── Info banner ──────────────────────────────────────────────── */
        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 0.875rem;
          padding: 0.9rem 1.1rem;
        }
        .info-icon {
          font-style: normal;
          font-size: 1rem;
          color: #2563EB;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .info-banner p {
          font-size: 0.82rem;
          color: #1d4ed8;
          margin: 0;
          line-height: 1.7;
        }

        /* ── Error ────────────────────────────────────────────────────── */
        .err-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
        }

        /* ── Thresholds card ──────────────────────────────────────────── */
        .thresholds-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 1.125rem;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: #0d3d5c;
          color: #fff;
        }
        .card-title {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .card-hint {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.55);
        }

        .thresholds-list {
          display: flex;
          flex-direction: column;
        }

        /* ── Threshold row ────────────────────────────────────────────── */
        .threshold-row {
          display: flex;
          align-items: flex-start;
          gap: 1.1rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
          animation: rowIn 0.35s ease both;
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .threshold-row:last-child { border-bottom: none; }
        .threshold-row:hover { background: #fafafa; }
        .row-dirty { background: #fffbeb !important; border-right: 3px solid #F59E0B; }

        /* ── Row index badge ──────────────────────────────────────────── */
        .row-index {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #f3f4f6;
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1.6rem;
        }

        /* ── Fields layout ────────────────────────────────────────────── */
        .row-fields {
          flex: 1;
          display: grid;
          grid-template-columns: 2fr 1.6fr 1.4fr;
          gap: 1rem;
          min-width: 0;
        }
        @media (max-width: 680px) {
          .row-fields { grid-template-columns: 1fr; }
          .threshold-row { flex-wrap: wrap; }
        }

        /* ── Field group ──────────────────────────────────────────────── */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .field-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .field-input {
          border: 1.5px solid #e5e7eb;
          border-radius: 0.625rem;
          padding: 0.55rem 0.8rem;
          font-size: 0.88rem;
          font-family: 'Cairo', sans-serif;
          color: #1f2937;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .field-input:focus {
          border-color: #1B5E8C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(27,94,140,.1);
        }

        /* ── Age inputs ───────────────────────────────────────────────── */
        .age-inputs {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .age-inp { flex: 1; text-align: center; }
        .age-sep { color: #9ca3af; font-size: 0.85rem; flex-shrink: 0; }

        /* ── Age bar ──────────────────────────────────────────────────── */
        .age-bar-track {
          height: 4px;
          background: #f3f4f6;
          border-radius: 999px;
          position: relative;
          overflow: hidden;
          margin-top: 0.35rem;
        }
        .age-bar-fill {
          position: absolute;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, #1B5E8C, #2E7EB8);
          border-radius: 999px;
          transition: left 0.2s, width 0.2s;
        }

        /* ── Juz field ────────────────────────────────────────────────── */
        .juz-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .juz-inp { flex: 1; text-align: center; }
        .juz-unit {
          font-size: 0.78rem;
          color: #6b7280;
          font-weight: 600;
          flex-shrink: 0;
        }
        .juz-scale {
          display: flex;
          gap: 0.3rem;
          flex-wrap: wrap;
          margin-top: 0.15rem;
        }
        .juz-preset {
          padding: 0.15rem 0.5rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          color: #6b7280;
          background: #fff;
          cursor: pointer;
          transition: all 0.12s;
        }
        .juz-preset:hover { border-color: #1B5E8C; color: #1B5E8C; }
        .juz-preset-active {
          border-color: #1B5E8C;
          background: #1B5E8C;
          color: #fff;
        }

        /* ── Row actions ──────────────────────────────────────────────── */
        .row-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          padding-top: 1.6rem;
          flex-shrink: 0;
        }
        .btn-save {
          padding: 0.55rem 1.1rem;
          background: linear-gradient(135deg, #1B5E8C, #134569);
          color: #fff;
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          border: none;
          border-radius: 0.625rem;
          cursor: pointer;
          min-width: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.12s, box-shadow 0.12s;
          box-shadow: 0 2px 6px rgba(27,94,140,.2);
        }
        .btn-save:hover:not(.btn-save-disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27,94,140,.3);
        }
        .btn-save-disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-reset {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #9ca3af;
          padding: 0.15rem;
          transition: color 0.12s, transform 0.2s;
        }
        .btn-reset:hover {
          color: #374151;
          transform: rotate(-45deg);
        }

        /* ── Save indicators ──────────────────────────────────────────── */
        .save-saving {
          font-size: 0.72rem;
          color: #6b7280;
          font-weight: 600;
        }
        .save-done {
          font-size: 0.72rem;
          color: #059669;
          font-weight: 700;
          animation: fadeIn 0.2s ease;
        }
        .save-err {
          font-size: 0.72rem;
          color: #DC2626;
          font-weight: 700;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: none; }
        }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .spin {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .sk-row { pointer-events: none; }
        .sk-num {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .sk-label {
          height: 10px;
          width: 80px;
          border-radius: 5px;
          margin-bottom: 0.35rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .sk-input {
          height: 36px;
          border-radius: 0.625rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .sk-btn {
          width: 64px;
          height: 34px;
          border-radius: 0.625rem;
          margin-top: 1.6rem;
          background: linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Empty state ──────────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 3rem 1rem;
          color: #9ca3af;
          font-size: 0.85rem;
        }
        .empty-state span { font-size: 2rem; }
        .empty-state p { margin: 0; }

        /* ── Help card ────────────────────────────────────────────────── */
        .help-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 1.4rem 1.5rem;
        }
        .help-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: #374151;
          margin: 0 0 1rem;
        }
        .help-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) { .help-grid { grid-template-columns: 1fr; } }
        .help-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .help-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0d3d5c;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Cairo', sans-serif;
        }
        .help-item strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.2rem;
        }
        .help-item p {
          font-size: 0.78rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
        }
      `}</style>
    </AppShell>
  );
}
