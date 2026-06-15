export default function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  loadingText = 'جارٍ المعالجة…',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-br from-[#1B5E8C] to-[#134569] text-white text-sm font-bold rounded-xl border-none cursor-pointer shadow-[0_2px_8px_rgba(27,94,140,.25)] hover:from-[#2E7EB8] hover:to-[#1B5E8C] hover:-translate-y-px active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-150 whitespace-nowrap ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
