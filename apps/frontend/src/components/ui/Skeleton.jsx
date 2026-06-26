import { twMerge } from 'tailwind-merge';

const SHIMMER = 'bg-gradient-to-r from-[#f0f4f8] via-[#e5eaf0] to-[#f0f4f8] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]';

export function Skeleton({ className, style }) {
  return <div className={twMerge(SHIMMER, 'rounded', className)} style={style} />;
}

export function SkeletonListRow({ className }) {
  return (
    <div className={twMerge('flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-b-0', className)}>
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3 w-[45%]" />
        <Skeleton className="h-2.5 w-[30%]" />
      </div>
      <Skeleton className="w-[90px] h-5 rounded-full" />
      <Skeleton className="w-20 h-3" />
    </div>
  );
}

export function SkeletonTableRow({ widths, className, cellClassName, barClassName = 'h-3.5' }) {
  return (
    <tr className={className}>
      {widths.map((w, i) => (
        <td key={i} className={cellClassName}>
          <Skeleton style={{ width: `${w}%` }} className={barClassName} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonRows({ count = 5, widths, cellClassName, barClassName }) {
  return Array.from({ length: count }).map((_, i) => (
    <SkeletonTableRow key={i} widths={widths} cellClassName={cellClassName} barClassName={barClassName} />
  ));
}
