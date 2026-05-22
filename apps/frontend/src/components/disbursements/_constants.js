export const STATUS_MAP = {
  draft:               { label: 'مسودة',           color: '#6b7280', bg: '#f3f4f6' },
  supervisor_approved: { label: 'اعتمد المشرف',    color: '#f59e0b', bg: '#fffbeb' },
  finance_approved:    { label: 'اعتمد المالي',    color: '#3b82f6', bg: '#eff6ff' },
  released:            { label: 'تم الصرف',         color: '#10b981', bg: '#ecfdf5' },
  rejected:            { label: 'مرفوض',            color: '#ef4444', bg: '#fef2f2' },
};

export const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ar-YE', { dateStyle: 'medium' }) : '—';

export const formatAmount = (n) =>
  n != null ? `${Number(n).toLocaleString('ar-YE')} ر.ي` : '—';
