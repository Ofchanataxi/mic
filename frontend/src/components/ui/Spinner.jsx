export default function Spinner({ label = 'Cargando' }) {
  return (
    <div className="inline-flex items-center gap-3 text-sm font-medium text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label}
    </div>
  );
}
