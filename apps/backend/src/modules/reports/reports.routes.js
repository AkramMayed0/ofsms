/**
 * reports.routes.js
 * Mounted at: /api/reports
 *
 * GET /api/reports/governorate/:id?format=pdf|excel
 *   GM only — export all orphans in a governorate as PDF or Excel.
 *
 * GET /api/reports/sponsor/:id?format=pdf|excel
 *   GM only — export all sponsorships for a single sponsor.
 *
 * Covers: SADD FR-053, FR-054, FR-055
 *
 * Place this file at:
 *   apps/backend/src/modules/reports/reports.routes.js
 *
 * Then add this line to apps/backend/src/index.js (after the governorates line):
 *   app.use('/api/reports', require('./modules/reports/reports.routes'));
 *
 * Also uncomment this line in index.js while you're there:
 *   app.use('/api/announcements', require('./modules/announcements/announcements.routes'));
 */

const { Router } = require('express');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query } = require('../../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const router = Router();

// ── Arabic label maps ─────────────────────────────────────────────────────────
const STATUS_AR = {
  under_review:      'قيد المراجعة',
  under_marketing:   'تحت التسويق',
  under_sponsorship: 'تحت الكفالة',
  rejected:          'مرفوض',
  inactive:          'غير نشط',
};

const GENDER_AR = { male: 'ذكر', female: 'أنثى' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return '—';
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB') : '—'; // DD/MM/YYYY — safe for PDF

// ── Shared DB query: all orphans in a governorate ─────────────────────────────
const fetchGovernorateOrphans = async (govId) => {
  const { rows: govRows } = await query(
    'SELECT id, name_ar, name_en FROM governorates WHERE id = $1',
    [govId]
  );
  if (!govRows[0]) return null;

  const { rows: orphans } = await query(
    `SELECT
       o.full_name,
       o.gender,
       o.date_of_birth,
       o.status,
       o.is_gifted,
       o.guardian_name,
       o.created_at,
       u.full_name          AS agent_name,
       s.full_name          AS sponsor_name,
       sp.monthly_amount,
       sp.start_date        AS sponsorship_start
     FROM orphans o
     LEFT JOIN users u
            ON u.id = o.agent_id
     LEFT JOIN sponsorships sp
            ON sp.beneficiary_id   = o.id
           AND sp.beneficiary_type = 'orphan'
           AND sp.is_active        = TRUE
     LEFT JOIN sponsors s
            ON s.id = sp.sponsor_id
     WHERE o.governorate_id = $1
     ORDER BY o.status ASC, o.created_at DESC`,
    [govId]
  );

  return { governorate: govRows[0], orphans };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/governorate/:id?format=pdf|excel
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/governorate/:id',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      const govId = parseInt(req.params.id, 10);
      if (isNaN(govId)) {
        return res.status(400).json({ error: 'معرّف المحافظة غير صحيح' });
      }

      const result = await fetchGovernorateOrphans(govId);
      if (!result) {
        return res.status(404).json({ error: 'المحافظة غير موجودة' });
      }

      const { governorate, orphans } = result;
      const format    = req.query.format === 'excel' ? 'excel' : 'pdf';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename  = `governorate-${governorate.name_en}-${timestamp}`;

      // ── EXCEL ───────────────────────────────────────────────────────────────
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator  = 'OFSMS';
        workbook.created  = new Date();

        const sheet = workbook.addWorksheet(governorate.name_ar, {
          views: [{ rightToLeft: true }],
        });

        sheet.columns = [
          { header: 'الاسم الكامل',    key: 'full_name',         width: 25 },
          { header: 'الجنس',           key: 'gender',            width: 8  },
          { header: 'العمر',           key: 'age',               width: 8  },
          { header: 'الحالة',          key: 'status',            width: 18 },
          { header: 'موهوب',           key: 'is_gifted',         width: 8  },
          { header: 'الوصي',           key: 'guardian_name',     width: 20 },
          { header: 'الكافل',          key: 'sponsor_name',      width: 20 },
          { header: 'المبلغ الشهري',   key: 'monthly_amount',    width: 14 },
          { header: 'تاريخ الكفالة',   key: 'sponsorship_start', width: 14 },
          { header: 'المندوب',         key: 'agent_name',        width: 20 },
          { header: 'تاريخ التسجيل',  key: 'created_at',        width: 14 },
        ];

        // Style header row
        const headerRow = sheet.getRow(1);
        headerRow.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FF1B5E8C' },
        };
        headerRow.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.alignment = { horizontal: 'center' };

        // Data rows
        orphans.forEach((o) => {
          const row = sheet.addRow({
            full_name:         o.full_name,
            gender:            GENDER_AR[o.gender]   || o.gender,
            age:               calcAge(o.date_of_birth),
            status:            STATUS_AR[o.status]   || o.status,
            is_gifted:         o.is_gifted ? 'نعم' : 'لا',
            guardian_name:     o.guardian_name       || '—',
            sponsor_name:      o.sponsor_name        || '—',
            monthly_amount:    o.monthly_amount
              ? `${Number(o.monthly_amount).toLocaleString()} ر.ي`
              : '—',
            sponsorship_start: fmtDate(o.sponsorship_start),
            agent_name:        o.agent_name          || '—',
            created_at:        fmtDate(o.created_at),
          });
          row.alignment = { horizontal: 'right' };
        });

        // Summary row
        const totalMonthly = orphans.reduce(
          (sum, o) => sum + Number(o.monthly_amount || 0), 0
        );
        sheet.addRow([]);
        const summaryRow = sheet.addRow({
          full_name:      `الإجمالي: ${orphans.length} يتيم`,
          monthly_amount: `${totalMonthly.toLocaleString()} ر.ي`,
        });
        summaryRow.font = { bold: true };

        // Freeze header row
        sheet.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.xlsx"`
        );
        res.setHeader('X-Report-Date',        timestamp);
        res.setHeader('X-Report-Total',       String(orphans.length));
        res.setHeader('X-Report-Governorate', governorate.name_en);

        await workbook.xlsx.write(res);
        return res.end();
      }

      // ── PDF ─────────────────────────────────────────────────────────────────
      const doc = new PDFDocument({
        size:    'A4',
        layout:  'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title:        `Governorate Report - ${governorate.name_en}`,
          Author:       'OFSMS',
          CreationDate: new Date(),
        },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.pdf"`
      );
      res.setHeader('X-Report-Date',        timestamp);
      res.setHeader('X-Report-Total',       String(orphans.length));
      res.setHeader('X-Report-Governorate', governorate.name_en);
      doc.pipe(res);

      // Title block
      doc
        .fontSize(16)
        .text('OFSMS - Orphan & Family Sponsorship Management System', { align: 'center' })
        .moveDown(0.3)
        .fontSize(13)
        .text(
          `Governorate Report: ${governorate.name_ar} (${governorate.name_en})`,
          { align: 'center' }
        )
        .moveDown(0.3)
        .fontSize(9)
        .fillColor('#555555')
        .text(
          `Export Date: ${timestamp}   |   Total Orphans: ${orphans.length}`,
          { align: 'center' }
        )
        .fillColor('#000000')
        .moveDown(1);

      // Table setup
      const tableTop   = doc.y;
      const pageWidth  = doc.page.width - 80;
      const colWidths  = [130, 40, 35, 90, 40, 115, 110, 75, 80];
      const headers    = [
        'Full Name', 'Gender', 'Age', 'Status',
        'Gifted', 'Sponsor', 'Agent', 'Amount', 'Registered',
      ];
      const rowHeight  = 18;
      const fontSize   = 7;

      // Header row background
      doc.rect(40, tableTop, pageWidth, rowHeight).fill('#1B5E8C');
      let hx = 40;
      headers.forEach((h, i) => {
        doc
          .fillColor('#FFFFFF')
          .fontSize(fontSize)
          .text(h, hx + 2, tableTop + 5, {
            width:    colWidths[i] - 4,
            align:    'center',
            lineBreak: false,
          });
        hx += colWidths[i];
      });

      // Data rows
      orphans.forEach((o, idx) => {
        const rowY = tableTop + rowHeight + idx * rowHeight;

        // Alternate stripe
        if (idx % 2 === 0) {
          doc.rect(40, rowY, pageWidth, rowHeight).fill('#F0F4F8');
        }

        const cells = [
          o.full_name                       || '—',
          GENDER_AR[o.gender]               || o.gender,
          String(calcAge(o.date_of_birth)),
          STATUS_AR[o.status]               || o.status,
          o.is_gifted ? 'Yes' : 'No',
          o.sponsor_name                    || '—',
          o.agent_name                      || '—',
          o.monthly_amount
            ? `${Number(o.monthly_amount).toLocaleString()}`
            : '—',
          fmtDate(o.created_at),
        ];

        let cx = 40;
        doc.fillColor('#000000');
        cells.forEach((cell, i) => {
          doc.fontSize(fontSize).text(String(cell), cx + 2, rowY + 5, {
            width:    colWidths[i] - 4,
            align:    'center',
            lineBreak: false,
          });
          cx += colWidths[i];
        });

        // New page guard
        if (rowY + rowHeight > doc.page.height - 60) {
          doc.addPage();
        }
      });

      // Summary footer
      const totalMonthly = orphans.reduce(
        (sum, o) => sum + Number(o.monthly_amount || 0), 0
      );
      doc
        .moveDown(2)
        .fontSize(9)
        .fillColor('#333333')
        .text(
          `Total Monthly: ${totalMonthly.toLocaleString()} YER   |   ` +
          `Under Sponsorship: ${orphans.filter(o => o.status === 'under_sponsorship').length}   |   ` +
          `Gifted: ${orphans.filter(o => o.is_gifted).length}`,
          { align: 'center' }
        )
        .moveDown(0.5)
        .fontSize(7)
        .fillColor('#999999')
        .text(
          `Exported by OFSMS — ${new Date().toLocaleString()}`,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/sponsor/:id?format=pdf|excel
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/sponsor/:id',
  authenticate,
  authorize('gm'),
  async (req, res, next) => {
    try {
      const { rows: sponsorRows } = await query(
        'SELECT id, full_name, phone, email FROM sponsors WHERE id = $1',
        [req.params.id]
      );
      if (!sponsorRows[0]) {
        return res.status(404).json({ error: 'الكافل غير موجود' });
      }
      const sponsor = sponsorRows[0];

      const { rows: sponsorships } = await query(
        `SELECT
           COALESCE(o.full_name, f.family_name)          AS beneficiary_name,
           CASE
             WHEN sp.beneficiary_type = 'orphan' THEN 'يتيم'
             ELSE 'أسرة'
           END                                           AS type_ar,
           COALESCE(go.name_ar, gf.name_ar)              AS governorate_ar,
           COALESCE(uo.full_name, uf.full_name)          AS agent_name,
           sp.monthly_amount,
           sp.start_date,
           sp.end_date,
           sp.is_active
         FROM sponsorships sp
         LEFT JOIN orphans      o  ON o.id  = sp.beneficiary_id
                                  AND sp.beneficiary_type = 'orphan'
         LEFT JOIN families     f  ON f.id  = sp.beneficiary_id
                                  AND sp.beneficiary_type = 'family'
         LEFT JOIN governorates go ON go.id = o.governorate_id
         LEFT JOIN governorates gf ON gf.id = f.governorate_id
         LEFT JOIN users        uo ON uo.id = o.agent_id
         LEFT JOIN users        uf ON uf.id = f.agent_id
         WHERE sp.sponsor_id = $1
         ORDER BY sp.is_active DESC, sp.start_date DESC`,
        [req.params.id]
      );

      const format       = req.query.format === 'excel' ? 'excel' : 'pdf';
      const timestamp    = new Date().toISOString().split('T')[0];
      const filename     = `sponsor-${req.params.id.slice(0, 8)}-${timestamp}`;
      const activeTotal  = sponsorships
        .filter(s => s.is_active)
        .reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0);

      // ── EXCEL ─────────────────────────────────────────────────────────────
      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'OFSMS';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Sponsorships', {
          views: [{ rightToLeft: true }],
        });

        sheet.columns = [
          { header: 'المستفيد',        key: 'name',       width: 25 },
          { header: 'النوع',           key: 'type_ar',    width: 8  },
          { header: 'المحافظة',        key: 'gov',        width: 18 },
          { header: 'المندوب',         key: 'agent',      width: 20 },
          { header: 'المبلغ الشهري',  key: 'amount',     width: 14 },
          { header: 'تاريخ البداية',  key: 'start',      width: 14 },
          { header: 'تاريخ الانتهاء', key: 'end',        width: 14 },
          { header: 'نشطة',           key: 'active',     width: 8  },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FF1B5E8C' },
        };
        headerRow.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.alignment = { horizontal: 'center' };

        sponsorships.forEach((s) => {
          const row = sheet.addRow({
            name:   s.beneficiary_name || '—',
            type_ar: s.type_ar,
            gov:    s.governorate_ar   || '—',
            agent:  s.agent_name       || '—',
            amount: s.monthly_amount
              ? `${Number(s.monthly_amount).toLocaleString()} ر.ي`
              : '—',
            start:  fmtDate(s.start_date),
            end:    s.end_date ? fmtDate(s.end_date) : '—',
            active: s.is_active ? 'نعم' : 'لا',
          });
          row.alignment = { horizontal: 'right' };
        });

        sheet.addRow([]);
        const sumRow = sheet.addRow({
          name:   `إجمالي الكفالات النشطة: ${sponsorships.filter(s => s.is_active).length}`,
          amount: `${activeTotal.toLocaleString()} ر.ي`,
        });
        sumRow.font = { bold: true };

        sheet.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.xlsx"`
        );
        res.setHeader('X-Report-Date',    timestamp);
        res.setHeader('X-Report-Sponsor', sponsor.full_name);

        await workbook.xlsx.write(res);
        return res.end();
      }

      // ── PDF ───────────────────────────────────────────────────────────────
      const doc = new PDFDocument({
        size:    'A4',
        layout:  'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        info: {
          Title:        `Sponsor Report - ${sponsor.full_name}`,
          Author:       'OFSMS',
          CreationDate: new Date(),
        },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.pdf"`
      );
      res.setHeader('X-Report-Date',    timestamp);
      res.setHeader('X-Report-Sponsor', sponsor.full_name);
      doc.pipe(res);

      doc
        .fontSize(16)
        .text('OFSMS - Orphan & Family Sponsorship Management System', { align: 'center' })
        .moveDown(0.3)
        .fontSize(13)
        .text(`Sponsor Portfolio: ${sponsor.full_name}`, { align: 'center' })
        .moveDown(0.3)
        .fontSize(9)
        .fillColor('#555555')
        .text(
          `${sponsor.email || ''}${sponsor.phone ? '   ' + sponsor.phone : ''}   |   ` +
          `Export Date: ${timestamp}   |   Total Records: ${sponsorships.length}`,
          { align: 'center' }
        )
        .fillColor('#000000')
        .moveDown(1);

      const tTop      = doc.y;
      const pWidth    = doc.page.width - 80;
      const cols      = [140, 55, 115, 125, 85, 85, 85, 50];
      const hdrs      = ['Beneficiary', 'Type', 'Governorate', 'Agent', 'Amount/Mo', 'Start', 'End', 'Active'];
      const rh        = 18;
      const fs        = 7;

      doc.rect(40, tTop, pWidth, rh).fill('#1B5E8C');
      let hx = 40;
      hdrs.forEach((h, i) => {
        doc.fillColor('#FFFFFF').fontSize(fs).text(h, hx + 2, tTop + 5, {
          width:    cols[i] - 4,
          align:    'center',
          lineBreak: false,
        });
        hx += cols[i];
      });

      sponsorships.forEach((s, idx) => {
        const ry = tTop + rh + idx * rh;
        if (idx % 2 === 0) {
          doc.rect(40, ry, pWidth, rh).fill('#F0F4F8');
        }
        const cells = [
          s.beneficiary_name || '—',
          s.type_ar,
          s.governorate_ar   || '—',
          s.agent_name       || '—',
          s.monthly_amount
            ? `${Number(s.monthly_amount).toLocaleString()}`
            : '—',
          fmtDate(s.start_date),
          s.end_date ? fmtDate(s.end_date) : '—',
          s.is_active ? 'Yes' : 'No',
        ];
        let cx = 40;
        doc.fillColor('#000000');
        cells.forEach((cell, i) => {
          doc.fontSize(fs).text(String(cell), cx + 2, ry + 5, {
            width:    cols[i] - 4,
            align:    'center',
            lineBreak: false,
          });
          cx += cols[i];
        });
        if (ry + rh > doc.page.height - 60) doc.addPage();
      });

      doc
        .moveDown(2)
        .fontSize(9)
        .fillColor('#333333')
        .text(
          `Active Monthly Total: ${activeTotal.toLocaleString()} YER   |   ` +
          `Active: ${sponsorships.filter(s => s.is_active).length}   |   ` +
          `Historical: ${sponsorships.filter(s => !s.is_active).length}`,
          { align: 'center' }
        )
        .moveDown(0.5)
        .fontSize(7)
        .fillColor('#999999')
        .text(`Exported by OFSMS — ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
