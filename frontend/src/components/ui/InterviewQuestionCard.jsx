import Badge from './Badge.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';
import MonacoCodeEditor from './MonacoCodeEditor.jsx';
import Select from './Select.jsx';
import { formatSkillType } from '../../utils/formatters.js';

const languageOptions = ['javascript', 'python', 'java', 'typescript', 'cpp'];

export default function InterviewQuestionCard({ question, response, onAnswerChange, onCodeChange, onLanguageChange }) {
  const isCoding = question.questionType === 'CODING';
  const codeSubmission = response?.codeSubmission || { language: question.language || 'javascript', code: '' };

  return (
    <Card>
      <CardHeader
        title={`Pregunta ${question.orderIndex || ''}`}
        description={`${question.topic || 'Área'} - ${question.subtopic || 'Tema'}`}
        action={<Badge tone={isCoding ? 'info' : 'default'}>{formatSkillType(question.questionType)}</Badge>}
      />
      <CardBody className="space-y-5">
        <div className="rounded-lg bg-slate-50 p-5 text-base leading-7 text-slate-900">
          {question.prompt}
        </div>

        {isCoding ? (
          <div className="space-y-3">
            <div className="max-w-xs">
              <Select
                id="coding-language"
                label="Lenguaje"
                value={codeSubmission.language || 'javascript'}
                onChange={(event) => onLanguageChange(event.target.value)}
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </Select>
            </div>
            <MonacoCodeEditor
              language={codeSubmission.language || 'javascript'}
              value={codeSubmission.code || ''}
              onChange={onCodeChange}
            />
          </div>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Respuesta</span>
            <textarea
              className="focus-ring min-h-48 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400"
              value={response?.answerText || ''}
              onChange={(event) => onAnswerChange(event.target.value)}
              placeholder="Escribe tu respuesta aquí..."
            />
          </label>
        )}
      </CardBody>
    </Card>
  );
}
