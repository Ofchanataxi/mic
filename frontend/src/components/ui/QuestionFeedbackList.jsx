export default function QuestionFeedbackList({ questions = [], selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      {questions.map((question, index) => (
        <button
          key={question.questionId}
          type="button"
          onClick={() => onSelect(question.questionId)}
          className={`focus-ring h-11 rounded-md border px-3 text-sm font-semibold transition ${
            selectedId === question.questionId
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
          }`}
        >
          Pregunta {question.order || index + 1}
        </button>
      ))}
    </div>
  );
}
