import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { candidateApi } from '../../api/candidateApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Input from '../../components/ui/Input.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProfileSummaryCard from '../../components/ui/ProfileSummaryCard.jsx';
import Select from '../../components/ui/Select.jsx';
import TopicBadge from '../../components/ui/TopicBadge.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({ targetRole: '', level: 'JUNIOR' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hydrateForm = (profileData) => {
    setForm({
      targetRole: profileData?.targetRole || '',
      level: profileData?.estimatedSeniority || 'JUNIOR',
    });
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, topicsData] = await Promise.all([
        candidateApi.getMyProfile(),
        candidateApi.getMyTopics(),
      ]);
      setProfile(profileData);
      hydrateForm(profileData);
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

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const cancelEdit = () => {
    hydrateForm(profile);
    setEditing(false);
    setSuccess('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await candidateApi.updateMyProfile({
        targetRole: form.targetRole,
        level: form.level,
      });
      setProfile(updated);
      hydrateForm(updated);
      setEditing(false);
      setSuccess('Perfil actualizado correctamente.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Perfil"
        title="Perfil del candidato"
        description="Resumen generado desde tu CV para personalizar tus entrevistas."
      />

      {loading ? <LoadingState label="Cargando perfil" /> : null}
      {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}
      {success ? <div className="mb-5"><Alert tone="success">{success}</Alert></div> : null}

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
                description="Puedes ajustar estos datos antes de crear nuevas entrevistas."
                action={!editing ? <Button variant="secondary" onClick={() => setEditing(true)}>Editar</Button> : null}
              />
              <CardBody>
                <form className="space-y-4" onSubmit={saveProfile}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="profile-target-role"
                      name="targetRole"
                      label="Rol objetivo"
                      value={form.targetRole}
                      onChange={updateField}
                      disabled={!editing}
                      className={!editing ? 'bg-slate-50 text-slate-500' : ''}
                    />
                    <Select
                      id="profile-level"
                      name="level"
                      label="Nivel"
                      value={form.level}
                      onChange={updateField}
                      disabled={!editing}
                      className={!editing ? 'bg-slate-50 text-slate-500' : ''}
                    >
                      <option value="JUNIOR">Junior</option>
                      <option value="MID">Mid</option>
                      <option value="SENIOR">Senior</option>
                    </Select>
                  </div>
                  {editing ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
                      <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar</Button>
                    </div>
                  ) : null}
                </form>
              </CardBody>
            </Card>
          </div>

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
