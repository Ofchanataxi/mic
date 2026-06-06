import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, ClipboardList } from 'lucide-react';
import { candidateApi } from '../../api/candidateApi.js';
import { interviewApi } from '../../api/interviewApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import { useAuth } from '../auth/useAuth.js';

const validLevels = ['JUNIOR', 'MID', 'SENIOR'];

export default function NewInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ targetRole: '', level: 'JUNIOR' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const profileLevel = validLevels.includes(profile?.estimatedSeniority)
    ? profile.estimatedSeniority
    : 'JUNIOR';
  const hasProfileChanges = Boolean(profile) && (
    form.targetRole.trim() !== (profile.targetRole || '').trim()
    || form.level !== profileLevel
  );

  useEffect(() => {
    candidateApi.getMyProfile()
      .then((data) => {
        const inferredLevel = validLevels.includes(data.estimatedSeniority) ? data.estimatedSeniority : 'JUNIOR';
        setProfile(data);
        setForm((current) => ({
          ...current,
          targetRole: data.targetRole || current.targetRole,
          level: inferredLevel,
        }));
      })
      .catch(() => setProfile(null));
  }, []);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (event.target.name === 'targetRole' || event.target.name === 'level') {
      setSuccess('');
    }
  };

  const saveProfileChanges = async () => {
    if (!form.targetRole.trim()) {
      setError('Ingresa un puesto objetivo.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = await candidateApi.updateMyProfile({
        targetRole: form.targetRole.trim(),
        level: form.level,
      });
      setProfile(updatedProfile);
      setForm((current) => ({
        ...current,
        targetRole: updatedProfile.targetRole || current.targetRole,
        level: validLevels.includes(updatedProfile.estimatedSeniority)
          ? updatedProfile.estimatedSeniority
          : current.level,
      }));
      setSuccess('Puesto objetivo y nivel guardados correctamente.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!profile?.id) {
      setError('Primero debes generar un perfil desde tu CV.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await interviewApi.createInterview({
        userId: user.userId || user.id,
        candidateProfileId: profile.id,
        targetRole: form.targetRole,
        level: form.level,
        questionCount: 8,
      });
      navigate(`/interviews/${result.interviewId}/session`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Nueva entrevista"
        description="Configura la entrevista. Al crearla irás a una sesión con cámara, grabación continua y preguntas adaptadas a tu perfil."
      />

      <Card className="max-w-2xl">
        <CardHeader
          title="Configuración"
          description={profile ? `Perfil: ${profile.fullName || 'listo para entrevista'}` : 'Perfil no encontrado'}
        />
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {success ? <Alert tone="success">{success}</Alert> : null}
            {!profile ? <Alert tone="warning">Sube tu CV y genera un perfil antes de crear entrevistas.</Alert> : null}
            <Alert tone="info">
              El puesto objetivo y el nivel fueron identificados desde tu CV. Puedes modificarlos para esta entrevista.
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="targetRole"
                name="targetRole"
                label="Puesto objetivo"
                value={form.targetRole}
                onChange={updateField}
                placeholder="Backend Developer"
                required
              />
              <Select
                id="level"
                name="level"
                label="Nivel"
                value={form.level}
                onChange={updateField}
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid</option>
                <option value="SENIOR">Senior</option>
              </Select>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={!hasProfileChanges || saving}
              onClick={saveProfileChanges}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ClipboardList className="h-4 w-4 text-brand-600" />
                  8 preguntas
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  3 técnicas, 3 blandas y 2 ejercicios de código.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Clock3 className="h-4 w-4 text-brand-600" />
                  Duración máxima
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Dispondrás de hasta 30 minutos para completar la entrevista.
                </p>
              </div>
            </div>
            <Button type="submit" disabled={loading || !profile}>
              <ClipboardList className="h-4 w-4" />
              {loading ? 'Creando...' : 'Crear entrevista'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
