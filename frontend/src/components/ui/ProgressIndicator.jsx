export default function ProgressIndicator({ current, total }) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">Pregunta {current} de {total}</span>
        <span className="text-slate-500">{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
