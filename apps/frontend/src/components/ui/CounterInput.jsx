'use client';

export default function CounterInput({ value, onChange, min = 1, max = 30, error }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw === '') { onChange(min); return; }
    const num = parseInt(raw, 10);
    if (num >= min && num <= max) onChange(num);
    else if (num > max) onChange(max);
    else onChange(min);
  };

  const BTN = 'w-8 h-8 rounded-full border-[1.5px] border-gray-300 dark:border-[#1E344B] bg-white dark:bg-[#111E2E] text-[1.1rem] font-bold text-gray-700 dark:text-slate-200 cursor-pointer flex items-center justify-center transition-all leading-none hover:not(:disabled):border-[#1B5E8C] dark:hover:not(:disabled):border-primary-400 hover:not(:disabled):text-[#1B5E8C] dark:hover:not(:disabled):text-primary-300 hover:not(:disabled):bg-blue-50 dark:hover:not(:disabled):bg-[#1E344B] disabled:opacity-35 disabled:cursor-not-allowed';

  return (
    <div className={`inline-flex items-center gap-3 bg-slate-50 dark:bg-[#17283C] border-[1.5px] ${error ? 'border-red-600' : 'border-[#e5eaf0] dark:border-[#1E344B]'} rounded-xl py-2 px-4`}>
      <button type="button" className={BTN} onClick={dec} disabled={value <= min}>−</button>
      <input
        type="text"
        inputMode="numeric"
        className="w-14 text-center text-[1.75rem] font-extrabold text-[#0d3d5c] dark:text-slate-100 border-none bg-transparent outline-none font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={handleInput}
        min={min}
        max={max}
      />
      <button type="button" className={BTN} onClick={inc} disabled={value >= max}>+</button>
      <span className="text-[0.82rem] text-slate-500 dark:text-slate-400 font-semibold">فرد</span>
    </div>
  );
}
