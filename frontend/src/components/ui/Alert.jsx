const tones = {
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function Alert({ tone = 'info', title, children }) {
  return (
    <div className={`rounded-lg border p-4 text-sm ${tones[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}
