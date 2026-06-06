import { useState } from 'react';
import { Camera, Clock3, Mic, ShieldCheck, TriangleAlert } from 'lucide-react';
import Button from './Button.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';

const instructions = [
  { icon: Clock3, text: 'Duración: máximo 30 minutos para completar las 8 preguntas.' },
  { icon: Camera, text: 'La cámara y el micrófono deben permanecer habilitados durante toda la entrevista.' },
  { icon: Mic, text: 'La grabación es continua y la entrevista no se puede pausar.' },
  {
    icon: TriangleAlert,
    text: 'No salgas, cierres ni recargues esta pantalla. Si abandonas la entrevista, se cancelará y no se generará feedback.',
  },
  { icon: ShieldCheck, text: 'Al finalizar, podrás revisar tu feedback cuando el análisis esté completo.' },
];

export default function InterviewInstructions({ questionCount, onStart, loading }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Antes de iniciar"
        description={`${questionCount || 0} preguntas preparadas. Revisa las condiciones antes de activar la cámara y el micrófono.`}
      />
      <CardBody className="space-y-5">
        <div className="grid gap-3">
          {instructions.map((item) => (
            <div key={item.text} className="flex gap-3 rounded-md border border-slate-100 p-3">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p className="text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Tratamiento de datos</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            La grabación, el audio, las respuestas y el código se utilizarán únicamente para procesar esta entrevista y generar tu evaluación. No se compartirán ni se utilizarán para fines diferentes.
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span className="text-sm leading-6 text-slate-700">
              Acepto el tratamiento de mis datos para realizar y evaluar esta entrevista.
            </span>
          </label>
        </div>

        <Button onClick={onStart} disabled={loading || !accepted}>
          {loading ? 'Solicitando permisos...' : 'Iniciar entrevista'}
        </Button>
      </CardBody>
    </Card>
  );
}
