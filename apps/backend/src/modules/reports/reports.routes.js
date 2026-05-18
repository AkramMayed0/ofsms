'use strict';

/**
 * reports.routes.js
 * Mounted at: /api/reports
 *
 * GET /api/reports/disbursement/:id/pdf
 * GET /api/reports/disbursement/:id/excel
 * GET /api/reports/governorate/:id/pdf
 * GET /api/reports/governorate/:id/excel
 *
 * Requires: npm install puppeteer-core exceljs
 */

const { Router }  = require('express');
const ExcelJS     = require('exceljs');
const { authenticate, authorize } = require('../../middleware/rbac');
const { query }   = require('../../config/db');
const { disbursementHTML, governorateHTML, htmlToPDF } = require('./reports.pdf');

const router = Router();

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

const DISBURSEMENT_STATUS_AR = {
  draft:    'مسودة',
  approved: 'معتمد',
  released: 'تم الصرف',
};

const calcAge = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1e3))} سنة`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
};

const sendPDF = (res, filename, buffer) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
};

const getDisbursementData = async (id) => {
  const { rows: listRows } = await query(
    `SELECT dl.*, u.full_name AS created_by_name
     FROM disbursement_lists dl
     LEFT JOIN users u ON u.id = dl.created_by
     WHERE dl.id = $1`, [id],
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
     ORDER BY di.created_at ASC`, [id],
  );
  return { list: listRows[0], items };
};

const getGovernorateData = async (id) => {
  const { rows: govRows } = await query(
    'SELECT id, name_ar, name_en FROM governorates WHERE id = $1', [id],
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
     ORDER BY o.created_at DESC`, [id],
  );
  return { governorate: govRows[0], orphans };
};

router.get(
  '/disbursement/:id/pdf',
  authenticate,
  authorize('gm', 'admin', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getDisbursementData(req.params.id);
      if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });

      const { list, items } = data;
      const monthName  = ARABIC_MONTHS[list.month] || list.month;
      const included   = items.filter((i) => i.included);
      const total      = included.reduce((s, i) => s + parseFloat(i.amount), 0);
      const statusText = DISBURSEMENT_STATUS_AR[list.status] || list.status;
      const issueDate  = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = disbursementHTML({
        title: `كشف صرف الأيتام والأسر — ${monthName} ${list.year}`,
        meta:  `منشئ الكشف: ${list.created_by_name || '—'} &nbsp;|&nbsp; تاريخ الإصدار: ${issueDate} &nbsp;|&nbsp; حالة الكشف: ${statusText}`,
        stats: [
          { label: 'إجمالي المستفيدين', value: `${included.length} مستفيد` },
          { label: 'إجمالي المبلغ',     value: `${total.toLocaleString('en')} ريال` },
          { label: 'حالة الكشف',        value: statusText },
          { label: 'المستثنون',         value: `${items.length - included.length} مستفيد` },
        ],
        rows:        included,
        totalAmount: total,
        totalCount:  included.length,
      });

      const pdf = await htmlToPDF(html);
      sendPDF(res, `كشف-صرف-${monthName}-${list.year}`, pdf);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  ['/disbursement/:id/excel', '/disbursement/:id/xlsx'],
  authenticate,
  authorize('gm', 'admin', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getDisbursementData(req.params.id);
      if (!data) return res.status(404).json({ error: 'الكشف غير موجود' });

      const { list, items } = data;
      const monthName = ARABIC_MONTHS[list.month] || list.month;

      const wb = new ExcelJS.Workbook();
      wb.creator = 'OFSMS';
      const ws   = wb.addWorksheet(`كشف ${monthName} ${list.year}`);

      ws.columns = [
        { header: 'المستفيد',      key: 'name',       width: 28 },
        { header: 'المحافظة',      key: 'governorate', width: 18 },
        { header: 'الكافل',        key: 'sponsor',    width: 22 },
        { header: 'المندوب',       key: 'agent',      width: 20 },
        { header: 'المبلغ',        key: 'amount',     width: 14 },
        { header: 'مُدرَج',        key: 'included',   width: 10 },
        { header: 'سبب الاستثناء', key: 'exclusion',  width: 25 },
      ];

      ws.getRow(1).eachCell((cell) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4f72' } };
        cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border    = { bottom: { style: 'medium', color: { argb: 'FFc9a84c' } } };
      });
      ws.getRow(1).height = 26;

      items.forEach((item, idx) => {
        const row = ws.addRow({
          name:        item.beneficiary_name || '—',
          governorate: item.governorate_ar   || '—',
          sponsor:     item.sponsor_name     || '—',
          agent:       item.agent_name       || '—',
          amount:      parseFloat(item.amount),
          included:    item.included ? 'نعم' : 'لا',
          exclusion:   item.exclusion_reason || '',
        });
        const bg = idx % 2 === 0 ? 'FFF7FAFD' : 'FFFFFFFF';
        row.eachCell((cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
        if (!item.included) {
          row.getCell('included').font  = { color: { argb: 'FFb52020' }, bold: true };
          row.getCell('exclusion').font = { color: { argb: 'FF7a95a8' }, italic: true };
        }
        const amtCell     = row.getCell('amount');
        amtCell.numFmt    = '#,##0';
        amtCell.alignment = { horizontal: 'right', vertical: 'middle' };
      });

      const totalRow = ws.addRow({
        name:     'الإجمالي',
        amount:   items.filter((i) => i.included).reduce((s, i) => s + parseFloat(i.amount), 0),
        included: `${items.filter((i) => i.included).length} مستفيد`,
      });
      totalRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd0e8f5' } };
        cell.font = { bold: true, color: { argb: 'FF1a4f72' } };
      });
      totalRow.getCell('amount').numFmt = '#,##0';
      ws.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];

      const filename = `كشف-صرف-${monthName}-${list.year}`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/governorate/:id/pdf',
  authenticate,
  authorize('gm', 'admin', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getGovernorateData(req.params.id);
      if (!data) return res.status(404).json({ error: 'المحافظة غير موجودة' });

      const { governorate, orphans } = data;
      const issueDate   = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const bySponsor   = orphans.filter((o) => o.sponsor_name).length;
      const giftedCount = orphans.filter((o) => o.is_gifted).length;

      const rows = orphans.map((o) => ({
        ...o,
        age:        calcAge(o.date_of_birth),
        statusAr:   STATUS_AR[o.status] || o.status,
        registered: formatDate(o.created_at),
      }));

      const html = governorateHTML({
        title: `تقرير كفالة الأيتام — محافظة ${governorate.name_ar}`,
        meta:  `تاريخ الإصدار: ${issueDate} &nbsp;|&nbsp; إجمالي الأيتام: ${orphans.length}`,
        stats: [
          { label: 'إجمالي الأيتام', value: `${orphans.length}` },
          { label: 'تحت الكفالة',    value: `${bySponsor}` },
          { label: 'بدون كافل',      value: `${orphans.length - bySponsor}` },
          { label: 'موهوبون',        value: `${giftedCount}` },
        ],
        rows,
      });

      const pdf = await htmlToPDF(html);
      sendPDF(res, `أيتام-${governorate.name_ar}`, pdf);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  ['/governorate/:id/excel', '/governorate/:id/xlsx'],
  authenticate,
  authorize('gm', 'admin', 'supervisor', 'finance'),
  async (req, res, next) => {
    try {
      const data = await getGovernorateData(req.params.id);
      if (!data) return res.status(404).json({ error: 'المحافظة غير موجودة' });

      const { governorate, orphans } = data;

      const wb = new ExcelJS.Workbook();
      wb.creator = 'OFSMS';
      const ws   = wb.addWorksheet(`أيتام ${governorate.name_ar}`);

      ws.columns = [
        { header: 'الاسم الكامل',  key: 'name',       width: 28 },
        { header: 'الجنس',         key: 'gender',     width: 10 },
        { header: 'العمر',         key: 'age',        width: 12 },
        { header: 'الحالة',        key: 'status',     width: 18 },
        { header: 'موهوب',         key: 'gifted',     width: 10 },
        { header: 'الكافل',        key: 'sponsor',    width: 24 },
        { header: 'المندوب',       key: 'agent',      width: 20 },
        { header: 'تاريخ التسجيل', key: 'registered', width: 18 },
      ];

      ws.getRow(1).eachCell((cell) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a4f72' } };
        cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border    = { bottom: { style: 'medium', color: { argb: 'FFc9a84c' } } };
      });
      ws.getRow(1).height = 26;

      const STATUS_COLORS = {
        'تحت الكفالة':  'FF1a7a4a',
        'تحت التسويق':  'FF1d6fa8',
        'قيد المراجعة': 'FFb56a00',
        'مرفوض':        'FFb52020',
      };

      orphans.forEach((o, idx) => {
        const statusLabel = STATUS_AR[o.status] || o.status;
        const row = ws.addRow({
          name:       o.full_name,
          gender:     o.gender === 'female' ? 'أنثى' : 'ذكر',
          age:        calcAge(o.date_of_birth),
          status:     statusLabel,
          gifted:     o.is_gifted ? 'نعم ★' : 'لا',
          sponsor:    o.sponsor_name || 'بدون كافل',
          agent:      o.agent_name   || '—',
          registered: o.created_at ? new Date(o.created_at).toLocaleDateString('ar-EG') : '—',
        });

        const bg = idx % 2 === 0 ? 'FFF7FAFD' : 'FFFFFFFF';
        row.eachCell((cell) => {
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { vertical: 'middle' };
        });

        const statusCell = row.getCell('status');
        if (STATUS_COLORS[statusLabel]) {
          statusCell.font = { color: { argb: STATUS_COLORS[statusLabel] }, bold: true };
        }
        if (!o.sponsor_name) {
          row.getCell('sponsor').font = { color: { argb: 'FF7a95a8' }, italic: true };
        }
        if (o.is_gifted) {
          row.getCell('gifted').font = { color: { argb: 'FFb56a00' }, bold: true };
        }
      });

      ws.views     = [{ state: 'frozen', ySplit: 1, rightToLeft: true }];
      ws.autoFilter = { from: 'A1', to: 'H1' };

      const filename = `أيتام-${governorate.name_ar}`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;