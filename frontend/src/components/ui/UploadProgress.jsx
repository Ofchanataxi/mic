export default function UploadProgress({ steps = [], activeStep = 0 }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isDone = index < activeStep;
        const isActive = index === activeStep;
        return (
          <div key={step} className="flex items-center gap-3">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
            >
              {isDone ? '✓' : index + 1}
            </span>
            <span className={`text-sm ${isActive ? 'font-semibold text-slate-950' : 'text-slate-600'}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
