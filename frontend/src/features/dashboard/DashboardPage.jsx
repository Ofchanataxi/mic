import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardList, FileText, History, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import WelcomeOnboarding from '../../components/ui/WelcomeOnboarding.jsx';
import { useAuth } from '../auth/useAuth.js';

const stages = [
  {
    journeyLabel: 'Prepara tu experiencia',
    title: 'Subir Curriculum Vitae',
    description: 'Carga tu CV para identificar tu experiencia, habilidades, puesto objetivo y nivel.',
    onboardingDescription: 'Comienza cargando tu CV. CCInterview organizará tu experiencia y habilidades para personalizar las entrevistas.',
    action: 'Subir Curriculum Vitae',
    to: '/cv',
    icon: FileText,
  },
  {
    journeyLabel: 'Conoce tu perfil',
    title: 'Revisar mi perfil',
    description: 'Comprueba la información obtenida de tu CV antes de realizar una entrevista.',
    onboardingDescription: 'Revisa las habilidades identificadas y confirma que tu puesto objetivo y nivel representen lo que buscas.',
    action: 'Revisar mi perfil',
    to: '/profile',
    icon: UserRound,
  },
  {
    journeyLabel: 'Pon tus habilidades a prueba',
    title: 'Realizar entrevista',
    description: 'Inicia una entrevista personalizada de acuerdo con tu perfil profesional.',
    onboardingDescription: 'Realiza una entrevista de hasta 30 minutos con preguntas técnicas, blandas y ejercicios de código.',
    action: 'Nueva entrevista',
    to: '/interviews/new',
    icon: ClipboardList,
  },
  {
    journeyLabel: 'Convierte resultados en mejoras',
    title: 'Consultar resultados',
    description: 'Revisa tus entrevistas finalizadas, puntuaciones y recomendaciones.',
    onboardingDescription: 'Consulta tus resultados, fortalezas y recomendaciones para orientar tu preparación profesional.',
    action: 'Ver historial',
    to: '/history',
    icon: History,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Candidato';
  const onboardingKey = useMemo(
    () => `ccinterview:onboarding:${user?.id || user?.userId || user?.email || 'candidate'}`,
    [user],
  );

  useEffect(() => {
    if (!user) return;
    if (window.localStorage.getItem(onboardingKey) !== 'completed') {
      setOnboardingIndex(0);
      setOnboardingOpen(true);
    }
  }, [onboardingKey, user]);

  const completeOnboarding = () => {
    window.localStorage.setItem(onboardingKey, 'completed');
    setOnboardingOpen(false);
  };

  return (
    <>
      <PageHeader
        title={`Hola, ${name}`}
        description="Prepara tu perfil, realiza entrevistas y convierte cada resultado en una oportunidad de mejora."
        action={(
          <Button variant="secondary" onClick={() => {
            setOnboardingIndex(0);
            setOnboardingOpen(true);
          }}>
            <Sparkles className="h-4 w-4" />
            Ver recorrido
          </Button>
        )}
      />

      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Tu recorrido</h2>
        <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <Link key={stage.title} to={stage.to} className="group block h-full">
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
              <CardBody className="flex h-full flex-col">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <stage.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase text-brand-700">{stage.journeyLabel}</p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">{stage.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{stage.description}</p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-brand-700">
                  <span>{stage.action}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <WelcomeOnboarding
        open={onboardingOpen}
        stages={stages}
        currentIndex={onboardingIndex}
        onChange={setOnboardingIndex}
        onClose={completeOnboarding}
        onFinish={completeOnboarding}
      />
    </>
  );
}
