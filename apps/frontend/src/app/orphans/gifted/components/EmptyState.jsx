import { Star } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] bg-white border border-slate-200 rounded-3xl shadow-sm gap-4 p-8 text-center animate-in fade-in duration-500">
      <Star className="w-16 h-16 text-amber-500 fill-amber-500 mb-2 drop-shadow-md" />
      <h3 className="text-xl font-bold text-slate-800 m-0">لا يوجد أيتام موهوبون بعد</h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">
        يمكنك تصنيف يتيم كموهوب من صفحة إدارة الأيتام أو عند تسجيل يتيم جديد.
      </p>
    </div>
  );
}
