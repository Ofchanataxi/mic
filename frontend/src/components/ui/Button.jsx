const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-brand-600',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
};

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
