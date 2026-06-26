import { AlertTriangle } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

export default function RevokeModal({ orphan, onClose, onConfirm, loading }) {
  return (
    <Modal open={!!orphan} onClose={onClose} className="rounded-3xl p-8 text-center">
      <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4 drop-shadow-sm" />
      <h3 className="text-xl font-bold text-slate-800 mb-3">إلغاء تصنيف الموهوب</h3>
      <p className="text-sm text-slate-600 mb-8 leading-relaxed">
        هل أنت متأكد من إلغاء تصنيف <strong className="text-slate-800 font-bold">{orphan?.full_name}</strong> كيتيم موهوب؟
        سيُزال من هذه القائمة وتُحذف مزاياه الخاصة.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
        >
          تراجع
        </button>
        <button
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-60 disabled:active:scale-100 min-w-[140px]"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="xs" />
              <span>جارٍ الإلغاء…</span>
            </div>
          ) : (
            'نعم، إلغاء التصنيف'
          )}
        </button>
      </div>
    </Modal>
  );
}
