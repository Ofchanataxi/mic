import Badge from './Badge.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';
import MonacoCodeEditor from './MonacoCodeEditor.jsx';
import Select from './Select.jsx';
import { formatSkillType } from '../../utils/formatters.js';

const languageOptions = ['javascript', 'python', 'java', 'typescript', 'cpp'];

export default function InterviewQuestionCard({ question, response, onCodeChange, onLanguageChange }) {
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
          <div className="rounded-md border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600">
            Responde en voz alta. La respuesta se registrará automáticamente mientras la entrevista esté activa.
          </div>
        )}
      </CardBody>
    </Card>
  );
}
