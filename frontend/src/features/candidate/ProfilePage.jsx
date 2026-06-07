import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { candidateApi } from '../../api/candidateApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProfileSummaryCard from '../../components/ui/ProfileSummaryCard.jsx';
import TopicBadge from '../../components/ui/TopicBadge.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const technicalTopics = topics.filter((topic) => topic.skillType === 'TECHNICAL');
  const softTopics = topics.filter((topic) => topic.skillType === 'SOFT');
  const detectedTechnologies = Array.from(new Set(
    (profile?.rawStructuredProfile?.technologies || [])
      .map((technology) => String(technology || '').trim())
      .filter(Boolean),
  )).sort((left, right) => left.localeCompare(right));

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, topicsData] = await Promise.all([
        candidateApi.getMyProfile(),
        candidateApi.getMyTopics(),
      ]);
      setProfile(profileData);
      setTopics(topicsData.topics || profileData.topics || []);
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        setProfile(null);
        setTopics([]);
      } else {
        setError(getApiErrorMessage(apiError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <>
      <PageHeader
        title="Perfil del candidato"
        description="Resumen generado desde tu CV para personalizar tus entrevistas."
      />

      {loading ? <LoadingState label="Cargando perfil" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}

      {!loading && !error && !profile ? (
        <EmptyState
          icon={FileText}
          title="Aún no hay perfil generado"
          description="Sube un CV en PDF para preparar tu perfil."
          action={<Link className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700" to="/cv">Subir CV</Link>}
        />
      ) : null}

      {!loading && profile ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <ProfileSummaryCard profile={profile} />

            <Card>
              <CardHeader
                title="Datos de entrevista"
                description="Datos identificados a partir de tu Curriculum Vitae."
              />
              <CardBody className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Puesto objetivo</p>
                    <p className="mt-1 text-sm text-slate-900">{profile.targetRole || 'Pendiente'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Nivel</p>
                    <p className="mt-1 text-sm text-slate-900">{profile.estimatedSeniority || 'Pendiente'}</p>
                  </div>
                </div>
                <div className="rounded-md bg-brand-50 p-4 text-sm leading-6 text-slate-700">
                  Podrás editar el puesto objetivo y el nivel antes de iniciar cada entrevista.
                </div>
                <Link
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-600"
                  to="/interviews/new"
                >
                  Configurar una entrevista
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Tecnologías identificadas"
                description={`${detectedTechnologies.length} tecnologías encontradas en tu Curriculum Vitae`}
              />
              <CardBody>
                {detectedTechnologies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detectedTechnologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No se identificaron tecnologías específicas.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Áreas técnicas para entrevistas"
                description={`${technicalTopics.length} áreas organizadas para evaluar tus conocimientos`}
              />
              <CardBody className="space-y-4">
                {technicalTopics.map((topic) => <TopicBadge key={topic.id || topic.name} topic={topic} />)}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Habilidades blandas"
                description={`${softTopics.length} habilidades consideradas`}
              />
              <CardBody className="space-y-4">
                {softTopics.map((topic) => <TopicBadge key={topic.id || topic.name} topic={topic} />)}
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
