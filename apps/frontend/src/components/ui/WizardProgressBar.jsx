'use client';
import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const AR_DIGITS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export default function WizardProgressBar({ steps, currentStep, className }) {
  return (
    <div className={twMerge(
      'flex flex-wrap sm:flex-nowrap items-center gap-2 p-3.5 px-5 bg-white border border-[#e5eaf0] rounded-2xl mb-7 text-[0.8rem] font-semibold',
      className
    )}>
      {steps.map((label, i) => {
        const isActive = i + 1 === currentStep;
        const isDone = i + 1 < currentStep;
        return (
          <Fragment key={i}>
            <div className={`flex items-center gap-1.5 transition-all ${isActive ? 'text-[#1B5E8C]' : isDone ? 'text-emerald-500' : 'text-gray-400'}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[0.72rem] font-bold transition-all ${isActive ? 'bg-[#1B5E8C] text-white shadow-[0_0_0_3px_rgba(27,94,140,0.15)]' : isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isDone ? <Check size={14} strokeWidth={2.5} /> : AR_DIGITS[i]}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 border-t-[1.5px] mx-1 hidden sm:block transition-all ${isDone ? 'border-emerald-500 border-solid' : 'border-dashed border-[#dde2e8]'}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
