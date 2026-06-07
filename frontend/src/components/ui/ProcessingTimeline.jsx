import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { formatStatus } from '../../utils/formatters.js';

const isComplete = (status) => ['COMPLETED', 'READY', 'FINISHED'].includes(status);
const isFailed = (status) => ['FAILED', 'DISPATCH_FAILED', 'CANCELLED'].includes(status);

export default function ProcessingTimeline({ evaluationStatus, feedbackStatus }) {
  const feedbackComplete = isComplete(feedbackStatus);
  const steps = [
    { label: 'Entrevista enviada', status: 'COMPLETED' },
    { label: 'Evaluación en proceso', status: evaluationStatus },
    { label: 'Feedback en generación', status: feedbackStatus },
    { label: 'Feedback disponible', status: feedbackComplete ? 'COMPLETED' : feedbackStatus },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const complete = isComplete(step.status);
        const failed = isFailed(step.status);
        const Icon = failed ? XCircle : complete ? CheckCircle2 : step.status ? Loader2 : Circle;
        return (
          <div key={step.label} className="flex items-center gap-3 rounded-md border border-slate-100 p-3">
            <Icon className={`h-5 w-5 ${failed ? 'text-rose-600' : complete ? 'text-emerald-600' : 'text-brand-600'} ${!failed && !complete && step.status ? 'animate-spin' : ''}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-950">{step.label}</p>
              <p className="text-xs text-slate-500">{formatStatus(step.status, 'PENDING')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
