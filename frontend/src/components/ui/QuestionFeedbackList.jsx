import { formatScore } from '../../utils/formatters.js';
import StatusBadge from './StatusBadge.jsx';

export default function QuestionFeedbackList({ questions = [], selectedId, onSelect }) {
  return (
    <div className="space-y-2">
      {questions.map((question) => (
        <button
          key={question.questionId}
          type="button"
          onClick={() => onSelect(question.questionId)}
          className={`focus-ring w-full rounded-md border p-3 text-left transition ${
            selectedId === question.questionId ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Pregunta {question.order || '-'}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{question.questionText}</p>
            </div>
            <StatusBadge status={question.status} fallback={question.finalScore !== null ? formatScore(question.finalScore) : 'PENDING'} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            {question.skillType ? <span>{question.skillType}</span> : null}
            {question.topic ? <span>{question.topic}</span> : null}
          </div>
        </button>
      ))}
    </div>
  );
}
