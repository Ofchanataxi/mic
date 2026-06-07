import { useEffect, useMemo } from 'react';
import Badge from './Badge.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';
import MonacoCodeEditor from './MonacoCodeEditor.jsx';
import Select from './Select.jsx';
import { formatSkillType, normalizeStatusKey } from '../../utils/formatters.js';

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9+#]+/g, '');

const isCodingQuestion = (question) => {
  const type = normalizeStatusKey(question?.questionType || question?.skillType);
  return type === 'CODING' || type === 'CODE' || type === 'CODING_EXERCISE';
};

export default function InterviewQuestionCard({
  question,
  response,
  codeLanguages = [],
  onCodeChange,
  onLanguageChange,
}) {
  const isCoding = isCodingQuestion(question);
  const codeSubmission = response?.codeSubmission || { language: '', code: '' };

  const selectedLanguage = useMemo(() => {
    const byId = codeLanguages.find((language) => String(language.id) === String(codeSubmission.language));
    if (byId) return byId;

    const requested = normalize(codeSubmission.language || question.language);
    return codeLanguages.find((language) => {
      const name = normalize(language.name);
      const judge0Name = normalize(language.judge0Name);
      return requested && (name.includes(requested) || judge0Name.includes(requested) || requested.includes(name));
    }) || codeLanguages.find((language) => normalize(language.name).includes('javascript')) || codeLanguages[0] || null;
  }, [codeLanguages, codeSubmission.language, question.language]);

  useEffect(() => {
    if (!isCoding || !selectedLanguage) return;
    if (String(codeSubmission.language) === String(selectedLanguage.id) && codeSubmission.code) return;
    onLanguageChange(String(selectedLanguage.id), codeSubmission.code || selectedLanguage.template);
  }, [isCoding, selectedLanguage, codeSubmission.language, codeSubmission.code, onLanguageChange]);

  const changeLanguage = (event) => {
    const nextLanguage = codeLanguages.find((language) => String(language.id) === event.target.value);
    if (!nextLanguage) return;

    const currentTemplate = selectedLanguage?.template || '';
    const currentCode = codeSubmission.code || '';
    const nextCode = !currentCode.trim() || currentCode === currentTemplate
      ? nextLanguage.template
      : currentCode;
    onLanguageChange(String(nextLanguage.id), nextCode);
  };

  return (
    <Card>
      <CardHeader
        title={`Pregunta ${question.orderIndex || ''}`}
        description={`${question.topic || 'Área'} - ${question.subtopic || 'Tema'}`}
        action={<Badge tone={isCoding ? 'info' : 'default'}>{formatSkillType(question.questionType || question.skillType)}</Badge>}
      />
      <CardBody className="space-y-5">
        <div className="rounded-lg bg-slate-50 p-5 text-base leading-7 text-slate-900">
          {question.prompt}
        </div>

        {isCoding ? (
          <div className="space-y-4">
            <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800">
              Selecciona el lenguaje adecuado y conserva la lectura desde la entrada estándar. La solución se comprobará con varios casos de prueba; imprime únicamente el resultado solicitado.
            </div>
            <div className="max-w-sm">
              <Select
                id={`coding-language-${question.questionId}`}
                label="Lenguaje de programación"
                value={selectedLanguage ? String(selectedLanguage.id) : ''}
                onChange={changeLanguage}
                disabled={codeLanguages.length === 0}
              >
                {codeLanguages.length === 0 ? <option value="">Cargando lenguajes...</option> : null}
                {codeLanguages.map((language) => (
                  <option key={language.id} value={language.id}>{language.name}</option>
                ))}
              </Select>
            </div>
            <MonacoCodeEditor
              language={selectedLanguage?.monacoLanguage || 'plaintext'}
              value={codeSubmission.code || selectedLanguage?.template || ''}
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
