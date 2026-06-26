'use client';
import { twMerge } from 'tailwind-merge';

export default function DataTable({ columns, children, footer, minWidth, className }) {
  return (
    <div className={twMerge(
      'bg-white border border-[#e5eaf0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(27,94,140,0.05)]',
      className
    )}>
      <div className="overflow-x-auto [webkit-overflow-scrolling:touch]">
        <table
          className="w-full border-collapse"
          style={minWidth ? { minWidth } : undefined}
        >
          <thead>
            <tr className="bg-[#f8fafc]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={twMerge(
                    'px-4 py-3 text-right text-[0.72rem] font-bold text-[#6b7a8d] border-b border-[#e5eaf0] whitespace-nowrap',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer && (
        <div className="px-4 py-3 text-[0.78rem] text-gray-400 border-t border-[#f0f4f8]">
          {footer}
        </div>
      )}
    </div>
  );
}
