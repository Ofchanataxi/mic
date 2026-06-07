import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import Button from './Button.jsx';

export default function WelcomeOnboarding({
  open,
  stages,
  currentIndex,
  onChange,
  onClose,
  onFinish,
}) {
  if (!open || !stages.length) return null;
  const stage = stages[currentIndex];
  const Icon = stage.icon;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stages.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {stages.map((item, index) => (
              <span
                key={item.title}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-8 bg-brand-600' : index < currentIndex ? 'w-2 bg-brand-300' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar recorrido"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-semibold text-brand-700">{stage.journeyLabel}</p>
          <h2 id="welcome-title" className="mt-2 text-2xl font-bold text-slate-950">{stage.title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{stage.onboardingDescription || stage.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onChange(currentIndex - 1)}
            disabled={isFirst}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          {isLast ? (
            <Button onClick={onFinish}>
              <Check className="h-4 w-4" />
              Comenzar
            </Button>
          ) : (
            <Button onClick={() => onChange(currentIndex + 1)}>
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
