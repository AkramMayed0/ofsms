import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

export default function RejectModal({ title, onConfirm, onClose, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[95vw] bg-white rounded-2xl z-[51] shadow-2xl animate-[slideUp_0.2s_ease]"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-[#0d3d5c] m-0">{title}</h2>
          <button
            className="bg-transparent border-none text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => onConfirm(d.notes))}
          className="flex flex-col gap-4 p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              سبب الرفض <span className="text-red-600">*</span>
            </label>
            <textarea
              className={`input resize-y min-h-[100px] ${errors.notes ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="أدخل سبب الرفض بوضوح…"
              {...register('notes', { required: 'سبب الرفض مطلوب' })}
            />
            {errors.notes && (
              <p className="text-xs text-red-600 m-0">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end border-t border-gray-100 pt-4">
            <button
              type="button"
              className="btn-ghost border border-gray-200 text-sm"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl border-none cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
            >
              {loading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جارٍ الرفض…
                </>
              ) : (
                'تأكيد الرفض'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
