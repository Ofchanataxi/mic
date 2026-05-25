import { formatScore } from '../../utils/formatters.js';

export default function ScoreBar({ label, value }) {
  if (value === null || value === undefined) return null;
  const percent = Math.max(0, Math.min(100, Number(value)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-950">{formatScore(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
