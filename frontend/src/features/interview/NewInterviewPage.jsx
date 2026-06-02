import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
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
  const [form, setForm] = useState({ targetRole: '', level: 'JUNIOR', questionCount: 8 });
  const [editDetails, setEditDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const value = event.target.name === 'questionCount' ? Number(event.target.value) : event.target.value;
    setForm((current) => ({ ...current, [event.target.name]: value }));
  };

  const toggleDetailsEditing = () => {
    setEditDetails((current) => {
      const next = !current;
      if (!next && profile) {
        setForm((currentForm) => ({
          ...currentForm,
          targetRole: profile.targetRole || '',
          level: validLevels.includes(profile.estimatedSeniority) ? profile.estimatedSeniority : 'JUNIOR',
        }));
      }
      return next;
    });
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
        targetRole: form.targetRole || undefined,
        level: form.level,
        questionCount: form.questionCount,
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
        eyebrow="Entrevista"
        title="Nueva entrevista"
        description="Configura la entrevista. Al crearla irás a una sesión con cámara, grabación continua y preguntas adaptadas a tu perfil."
      />

      <Card className="max-w-2xl">
        <CardHeader title="Configuración" description={profile ? `Perfil: ${profile.fullName || 'listo para entrevista'}` : 'Perfil no encontrado'} />
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {!profile ? <Alert tone="warning">Sube tu CV y genera un perfil antes de crear entrevistas.</Alert> : null}
            <Alert tone="info">
              Usaremos el rol objetivo y el nivel inferidos desde tu CV. Puedes editarlos antes de crear la entrevista.
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="targetRole"
                name="targetRole"
                label="Rol objetivo"
                value={form.targetRole}
                onChange={updateField}
                placeholder="Backend Developer"
                disabled={!editDetails}
                className={!editDetails ? 'bg-slate-50 text-slate-500' : ''}
              />
              <Select
                id="level"
                name="level"
                label="Nivel"
                value={form.level}
                onChange={updateField}
                disabled={!editDetails}
                className={!editDetails ? 'bg-slate-50 text-slate-500' : ''}
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid</option>
                <option value="SENIOR">Senior</option>
              </Select>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-brand-700 hover:text-brand-600"
              onClick={toggleDetailsEditing}
            >
              {editDetails ? 'Usar datos inferidos' : 'Editar rol y nivel'}
            </button>

            <Input id="questionCount" name="questionCount" label="Cantidad de preguntas" type="number" min="5" max="12" value={form.questionCount} onChange={updateField} />
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
