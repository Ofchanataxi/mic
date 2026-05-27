export default function RecordingIndicator({ active, elapsedLabel }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-100 text-slate-500'
    }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'animate-pulse bg-rose-600' : 'bg-slate-400'}`} />
      {active ? `Grabando ${elapsedLabel || ''}` : 'Grabación inactiva'}
    </div>
  );
}
