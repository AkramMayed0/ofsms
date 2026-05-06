/**
 * reports.routes.js
 * Mounted at: /api/reports
 *
 * GET /api/reports/disbursement/:id/pdf    → PDF of a disbursement list
 * GET /api/reports/disbursement/:id/excel  → Excel of a disbursement list
 * GET /api/reports/governorate/:id/pdf     → PDF of all orphans in a governorate
 * GET /api/reports/governorate/:id/excel   → Excel of all orphans in a governorate
 */

const { Router } = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS    = require('exceljs');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const ARABIC_MONTHS = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const STATUS_AR = {
  under_review:      'قيد المراجعة',
  under_marketing:   'تحت التسويق',
  under_sponsorship: 'تحت الكفالة',
  rejected:          'مرفوض',
  inactive:          'غير نشط',
};

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} سنة`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────
const getDisbursementData = async (id) => {
  const { rows: listRows } = await query(
    `SELECT dl.*, u.full_name AS created_by_name
     FROM disbursement_lists dl
     LEFT JOIN users u ON u.id = dl.created_by
     WHERE dl.id = $1`, [id]
  );
  if (!listRows[0]) return null;

  const { rows: items } = await query(
    `SELECT
       di.amount, di.included, di.exclusion_reason,
       COALESCE(o.full_name, f.family_name)  AS beneficiary_name,
       COALESCE(go.name_ar, gf.name_ar)      AS governorate_ar,
       COALESCE(uo.full_name, uf.full_name)  AS agent_name,
       so.full_name                          AS sponsor_name
     FROM disbursement_items di
     LEFT JOIN orphans      o  ON o.id  = di.orphan_id
     LEFT JOIN families     f  ON f.id  = di.family_id
     LEFT JOIN governorates go ON go.id = o.governorate_id
     LEFT JOIN governorates gf ON gf.id = f.governorate_id
     LEFT JOIN users        uo ON uo.id = o.agent_id
     LEFT JOIN users        uf ON uf.id = f.agent_id
     LEFT JOIN sponsorships sp ON sp.beneficiary_id = COALESCE(di.orphan_id, di.family_id)
                               AND sp.is_active = TRUE
     LEFT JOIN sponsors     so ON so.id = sp.sponsor_id
     WHERE di.list_id = $1
     ORDER BY di.created_at ASC`, [id]
  );
  return { list: listRows[0], items };
};

const getGovernorateData = async (id) => {
  const { rows: govRows } = await query(
    'SELECT id, name_ar, name_en FROM governorates WHERE id = $1', [id]
  );
  if (!govRows[0]) return null;

  const { rows: orphans } = await query(
    `SELECT
       o.full_name, o.date_of_birth, o.gender, o.status, o.is_gifted, o.created_at,
       u.full_name  AS agent_name,
       s.full_name  AS sponsor_name
     FROM orphans o
     LEFT JOIN users u       ON u.id  = o.agent_id
     LEFT JOIN sponsorships sp
       ON sp.beneficiary_id   = o.id
      AND sp.beneficiary_type = 'orphan'
      AND sp.is_active        = TRUE
     LEFT JOIN sponsors s    ON s.id  = sp.sponsor_id
     WHERE o.governorate_id = $1
       AND o.status != 'inactive'
     ORDER BY o.created_at DESC`, [id]
  );
  return { governorate: govRows[0], orphans };
};

// ── PDF helpers ───────────────────────────────────────────────────────────────

/**
 * Creates a simple but clean PDF using pdfkit.
 * NOTE: pdfkit does not support Arabic shaping natively — text is written
 * LTR. For production, consider using a library like pdfkit-table or
 * serving pre-rendered HTML via Puppeteer. For now this gives a readable
 * English/numeric export with Arabic fields as-is.
 */
const buildPDF = (res, filename, buildFn) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.pdf"`);
  doc.pipe(res);
  buildFn(doc);
  doc.end();
};

// ── GET /api/reports/disbursement/:id/pdf ─────────────────────────────────────
router.get(
  '/disbursement/:id/pdf',
  authenticate,
  authorize('gm', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getDisbursementData(req.params.id);
      if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });

      const { list, items } = data;
      const monthName = ARABIC_MONTHS[list.month] || list.month;
      const total = items.filter(i => i.included).reduce((s, i) => s + parseFloat(i.amount), 0);

      buildPDF(res, `كشف-صرف-${monthName}-${list.year}`, (doc) => {
        // Header
        doc.fontSize(18).font('Helvetica-Bold')
           .text(`Disbursement List — ${monthName} ${list.year}`, { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica')
           .text(`Status: ${list.status}   |   Created by: ${list.created_by_name || '—'}   |   Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
        doc.moveDown(0.8);

        // Summary box
        doc.rect(40, doc.y, doc.page.width - 80, 36).fill('#f0f4f8').stroke('#e5eaf0');
        const boxY = doc.y - 34;
        doc.fill('#0d3d5c').fontSize(10).font('Helvetica-Bold')
           .text(`Total beneficiaries: ${items.filter(i => i.included).length}`, 55, boxY + 10);
        doc.text(`Total amount: ${total.toLocaleString()} YER`, 250, boxY + 10);
        doc.moveDown(1.5);

        // Table header
        const colX = [40, 180, 310, 390, 470];
        const headers = ['Beneficiary', 'Governorate', 'Sponsor', 'Agent', 'Amount'];
        doc.fill('#1B5E8C').rect(40, doc.y, doc.page.width - 80, 20).fill();
        headers.forEach((h, i) => {
          doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold')
             .text(h, colX[i], doc.y - 15, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80 });
        });
        doc.moveDown(0.3);

        // Table rows
        items.filter(i => i.included).forEach((item, idx) => {
          if (doc.y > doc.page.height - 80) doc.addPage();
          const rowY = doc.y;
          if (idx % 2 === 0) {
            doc.rect(40, rowY, doc.page.width - 80, 18).fill('#fafafa').stroke('#f0f4f8');
          }
          const vals = [
            item.beneficiary_name || '—',
            item.governorate_ar   || '—',
            item.sponsor_name     || '—',
            item.agent_name       || '—',
            `${parseFloat(item.amount).toLocaleString()}`,
          ];
          doc.fill('#1f2937').font('Helvetica').fontSize(8);
          vals.forEach((v, i) => {
            doc.text(v, colX[i], rowY + 4, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80, ellipsis: true });
          });
          doc.moveDown(0.55);
        });

        // Footer
        doc.moveDown(1);
        doc.fontSize(8).fill('#9ca3af')
           .text(`OFSMS — Orphan & Family Sponsorship Management System`, { align: 'center' });
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/reports/disbursement/:id/excel ───────────────────────────────────
router.get(
  '/disbursement/:id/excel',
  authenticate,
  authorize('gm', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getDisbursementData(req.params.id);
      if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });

      const { list, items } = data;
      const monthName = ARABIC_MONTHS[list.month] || list.month;

      const wb = new ExcelJS.Workbook();
      wb.creator = 'OFSMS';
      const ws = wb.addWorksheet(`كشف ${monthName} ${list.year}`);

      // Column widths + headers
      ws.columns = [
        { header: 'المستفيد',   key: 'name',        width: 28 },
        { header: 'المحافظة',   key: 'governorate',  width: 18 },
        { header: 'الكافل',     key: 'sponsor',      width: 22 },
        { header: 'المندوب',    key: 'agent',        width: 20 },
        { header: 'المبلغ',     key: 'amount',       width: 14 },
        { header: 'مُدرَج',     key: 'included',     width: 10 },
        { header: 'سبب الاستثناء', key: 'exclusion', width: 25 },
      ];

      // Style header row
      ws.getRow(1).eachCell(cell => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E8C' } };
        cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
        };
      });
      ws.getRow(1).height = 24;

      // Data rows
      items.forEach((item, idx) => {
        const row = ws.addRow({
          name:       item.beneficiary_name || '—',
          governorate:item.governorate_ar   || '—',
          sponsor:    item.sponsor_name     || '—',
          agent:      item.agent_name       || '—',
          amount:     parseFloat(item.amount),
          included:   item.included ? 'نعم' : 'لا',
          exclusion:  item.exclusion_reason || '',
        });

        // Alternate row bg
        const bg = idx % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });

        // Highlight excluded rows
        if (!item.included) {
          row.getCell('included').font = { color: { argb: 'FFDC2626' }, bold: true };
        }

        // Format amount as number
        const amountCell = row.getCell('amount');
        amountCell.numFmt = '#,##0';
        amountCell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Summary row
      const totalRow = ws.addRow({
        name: 'الإجمالي',
        amount: items.filter(i => i.included).reduce((s, i) => s + parseFloat(i.amount), 0),
        included: `${items.filter(i => i.included).length} مستفيد`,
      });
      totalRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
        cell.font = { bold: true };
      });

      // Freeze header + RTL view
      ws.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];

      const filename = `كشف-صرف-${monthName}-${list.year}`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/reports/governorate/:id/pdf ──────────────────────────────────────
router.get(
  '/governorate/:id/pdf',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      const data = await getGovernorateData(req.params.id);
      if (!data) return res.status(404).json({ error: 'المحافظة غير موجودة' });

      const { governorate, orphans } = data;

      buildPDF(res, `أيتام-${governorate.name_ar}`, (doc) => {
        // Header
        doc.fontSize(18).font('Helvetica-Bold')
           .text(`Orphans Report — ${governorate.name_en}`, { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica')
           .text(`Total: ${orphans.length} orphans   |   Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
        doc.moveDown(0.8);

        // Table header
        const colX  = [40, 170, 220, 290, 380, 470];
        const heads = ['Name', 'Age', 'Status', 'Sponsor', 'Agent', 'Registered'];
        doc.fill('#1B5E8C').rect(40, doc.y, doc.page.width - 80, 20).fill();
        heads.forEach((h, i) => {
          doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold')
             .text(h, colX[i], doc.y - 15, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80 });
        });
        doc.moveDown(0.3);

        orphans.forEach((o, idx) => {
          if (doc.y > doc.page.height - 80) doc.addPage();
          const rowY = doc.y;
          if (idx % 2 === 0) {
            doc.rect(40, rowY, doc.page.width - 80, 18).fill('#fafafa').stroke('#f0f4f8');
          }
          const vals = [
            o.full_name                 || '—',
            calcAge(o.date_of_birth),
            STATUS_AR[o.status]         || o.status,
            o.sponsor_name              || 'No sponsor',
            o.agent_name                || '—',
            formatDate(o.created_at),
          ];
          doc.fill('#1f2937').font('Helvetica').fontSize(8);
          vals.forEach((v, i) => {
            doc.text(v, colX[i], rowY + 4, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80, ellipsis: true });
          });
          doc.moveDown(0.55);
        });

        doc.moveDown(1);
        doc.fontSize(8).fill('#9ca3af')
           .text('OFSMS — Orphan & Family Sponsorship Management System', { align: 'center' });
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/reports/governorate/:id/excel ────────────────────────────────────
router.get(
  '/governorate/:id/excel',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      const data = await getGovernorateData(req.params.id);
      if (!data) return res.status(404).json({ error: 'المحافظة غير موجودة' });

      const { governorate, orphans } = data;

      const wb = new ExcelJS.Workbook();
      wb.creator = 'OFSMS';
      const ws = wb.addWorksheet(`أيتام ${governorate.name_ar}`);

      ws.columns = [
        { header: 'الاسم الكامل',    key: 'name',       width: 28 },
        { header: 'الجنس',           key: 'gender',     width: 10 },
        { header: 'العمر',           key: 'age',        width: 12 },
        { header: 'الحالة',          key: 'status',     width: 18 },
        { header: 'موهوب',           key: 'gifted',     width: 10 },
        { header: 'الكافل',          key: 'sponsor',    width: 24 },
        { header: 'المندوب',         key: 'agent',      width: 20 },
        { header: 'تاريخ التسجيل',   key: 'registered', width: 18 },
      ];

      // Header row style
      ws.getRow(1).eachCell(cell => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E8C' } };
        cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      ws.getRow(1).height = 24;

      // Data
      orphans.forEach((o, idx) => {
        const row = ws.addRow({
          name:       o.full_name,
          gender:     o.gender === 'female' ? 'أنثى' : 'ذكر',
          age:        calcAge(o.date_of_birth),
          status:     STATUS_AR[o.status] || o.status,
          gifted:     o.is_gifted ? 'نعم ⭐' : 'لا',
          sponsor:    o.sponsor_name || 'بدون كافل',
          agent:      o.agent_name   || '—',
          registered: o.created_at ? new Date(o.created_at).toLocaleDateString('ar-EG') : '—',
        });

        const bg = idx % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { vertical: 'middle' };
        });

        // Color-code status
        const statusCell = row.getCell('status');
        const statusColors = {
          'تحت الكفالة':  '22c55e',
          'تحت التسويق':  '3b82f6',
          'قيد المراجعة': 'f59e0b',
          'مرفوض':        'ef4444',
        };
        const col = statusColors[STATUS_AR[o.status]];
        if (col) statusCell.font = { color: { argb: `FF${col}` }, bold: true };

        // No sponsor → grey
        if (!o.sponsor_name) {
          row.getCell('sponsor').font = { color: { argb: 'FF9CA3AF' }, italic: true };
        }
      });

      // Freeze + RTL
      ws.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];

      // Auto-filter
      ws.autoFilter = { from: 'A1', to: `H1` };

      const filename = `أيتام-${governorate.name_ar}`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
