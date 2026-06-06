import { ArrowRight, ClipboardList, FileText, History, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useAuth } from '../auth/useAuth.js';

const steps = [
  {
    title: 'Subir Curriculum Vitae',
    description: 'Carga tu CV para identificar tu experiencia, habilidades, puesto objetivo y nivel.',
    action: 'Subir Curriculum Vitae',
    to: '/cv',
    icon: FileText,
  },
  {
    title: 'Revisar mi perfil',
    description: 'Comprueba la información obtenida de tu CV antes de realizar una entrevista.',
    action: 'Revisar mi perfil',
    to: '/profile',
    icon: UserRound,
  },
  {
    title: 'Realizar entrevista',
    description: 'Inicia una entrevista personalizada de acuerdo con tu perfil profesional.',
    action: 'Nueva entrevista',
    to: '/interviews/new',
    icon: ClipboardList,
  },
  {
    title: 'Consultar resultados',
    description: 'Revisa tus entrevistas finalizadas, puntuaciones y recomendaciones.',
    action: 'Ver historial',
    to: '/history',
    icon: History,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Candidato';

  return (
    <>
      <PageHeader
        title={`Hola, ${name}`}
        description="Sigue estos pasos para preparar tu perfil, realizar una entrevista y consultar tus resultados."
      />

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Tu proceso de entrevista</h2>
        <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
      </div>

      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <Link to={step.to} className="group block h-full">
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
                <CardBody className="flex h-full flex-col">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">Paso {index + 1}</span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{step.description}</p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-brand-700">
                    <span>{step.action}</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
