import { Star } from 'lucide-react';
import UIEmptyState from '@/components/ui/EmptyState';

export default function EmptyState() {
  return (
    <UIEmptyState
      icon={<Star className="w-16 h-16 text-amber-500 fill-amber-500 mb-2 drop-shadow-md" />}
      heading="لا يوجد أيتام موهوبون بعد"
      description="يمكنك تصنيف يتيم كموهوب من صفحة إدارة الأيتام أو عند تسجيل يتيم جديد."
      card
      className="min-h-[350px] border-slate-200 rounded-3xl shadow-sm gap-4 animate-in fade-in duration-500"
    />
  );
}
