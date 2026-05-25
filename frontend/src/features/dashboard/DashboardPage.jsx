import { ArrowRight, ClipboardList, FileText, History, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useAuth } from '../auth/useAuth.js';

const actions = [
  {
    title: 'Subir CV / Perfil',
    description: 'Carga tu CV y genera el perfil estructurado para entrevistas adaptativas.',
    to: '/cv',
    icon: FileText,
  },
  {
    title: 'Nueva entrevista',
    description: 'Configura rol, nivel y cantidad de preguntas para iniciar una entrevista.',
    to: '/interviews/new',
    icon: ClipboardList,
  },
  {
    title: 'Historial',
    description: 'Revisa entrevistas, estado de procesamiento y reportes disponibles.',
    to: '/history',
    icon: History,
  },
  {
    title: 'Feedback',
    description: 'Accede al reporte final cuando el procesamiento haya terminado.',
    to: '/history',
    icon: MessageSquareText,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Candidato';

  return (
    <>
      <PageHeader
        eyebrow="Inicio"
        title={`Hola, ${name}`}
        description="Este panel concentra el flujo principal: CV, perfil, entrevistas, procesamiento y feedback."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((item) => (
          <Link key={item.title} to={item.to} className="group block">
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
              <CardBody>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 min-h-16 text-sm leading-6 text-slate-500">{item.description}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-700">
                  Abrir
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div id="feedback" className="mt-6">
        <Card>
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Estado general</h2>
              <p className="mt-1 text-sm text-slate-500">La siguiente fase conectara detalle de feedback, video segmentado y sesion completa.</p>
            </div>
            <Link className="text-sm font-semibold text-brand-700 hover:text-brand-600" to="/history">
              Ver historial
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
