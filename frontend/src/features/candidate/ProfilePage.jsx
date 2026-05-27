import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
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

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError('');
      try {
        const [profileData, topicsData] = await Promise.all([
          candidateApi.getMyProfile(),
          candidateApi.getMyTopics(),
        ]);
        if (!mounted) return;
        setProfile(profileData);
        setTopics(topicsData.topics || profileData.topics || []);
      } catch (apiError) {
        if (!mounted) return;
        if (apiError.response?.status === 404) {
          setProfile(null);
          setTopics([]);
        } else {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Perfil"
        title="Perfil del candidato"
        description="Resumen generado desde tu CV para personalizar tus entrevistas."
      />

      {loading ? <LoadingState label="Cargando perfil" /> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

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
          <ProfileSummaryCard profile={profile} />

          <Card>
            <CardHeader title="Áreas de evaluación" description={`${topics.length} áreas detectadas`} />
            <CardBody className="space-y-4">
              {topics.map((topic) => <TopicBadge key={topic.id || topic.name} topic={topic} />)}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  );
}
