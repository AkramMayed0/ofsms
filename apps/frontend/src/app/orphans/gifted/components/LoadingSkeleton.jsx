export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-sm animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-slate-50 rounded-xl border border-slate-100" />
          <div className="flex gap-2 flex-wrap">
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="mt-auto flex gap-3 pt-4">
            <div className="h-11 bg-slate-200 rounded-xl flex-1" />
            <div className="h-11 bg-slate-100 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
