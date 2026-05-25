import { Camera, Maximize2, Mic, ShieldAlert, Timer } from 'lucide-react';
import Button from './Button.jsx';
import Card, { CardBody, CardHeader } from './Card.jsx';

const instructions = [
  { icon: Timer, text: 'La duracion depende del numero de preguntas. Reserva un bloque sin interrupciones.' },
  { icon: Maximize2, text: 'Usa pantalla completa y evita cambiar de pestana durante la entrevista.' },
  { icon: Camera, text: 'La camara y el microfono son requeridos antes de iniciar.' },
  { icon: Mic, text: 'La grabacion sera continua y no se pausa.' },
  { icon: ShieldAlert, text: 'Al finalizar se subira un unico video completo para evaluacion.' },
];

export default function InterviewInstructions({ questionCount, onStart, loading }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Antes de iniciar" description={`${questionCount || 0} preguntas generadas. Lee estas recomendaciones antes de activar camara y microfono.`} />
      <CardBody className="space-y-5">
        <div className="grid gap-3">
          {instructions.map((item) => (
            <div key={item.text} className="flex gap-3 rounded-md border border-slate-100 p-3">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p className="text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
        <Button onClick={onStart} disabled={loading}>
          {loading ? 'Solicitando permisos...' : 'Iniciar entrevista'}
        </Button>
      </CardBody>
    </Card>
  );
}
