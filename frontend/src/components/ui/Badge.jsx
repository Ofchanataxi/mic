const tones = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export function statusTone(status) {
  if (!status) return 'default';
  if (['READY', 'FINISHED', 'COMPLETED', 'DISPATCHED'].includes(status)) return 'success';
  if (['CREATED', 'IN_PROGRESS', 'PROCESSING', 'GENERATING', 'PENDING', 'WAITING'].includes(status)) return 'warning';
  if (['FAILED', 'DISPATCH_FAILED', 'CANCELLED'].includes(status)) return 'danger';
  return 'info';
}

export default function Badge({ children, tone = 'default' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children || 'Pendiente'}
    </span>
  );
}
