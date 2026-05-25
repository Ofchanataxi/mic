import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { candidateApi } from '../../api/candidateApi.js';
import { mediaApi } from '../../api/mediaApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import FileUploadCard from '../../components/ui/FileUploadCard.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import ProfileSummaryCard from '../../components/ui/ProfileSummaryCard.jsx';
import Select from '../../components/ui/Select.jsx';
import UploadProgress from '../../components/ui/UploadProgress.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import { useAuth } from '../auth/useAuth.js';

const steps = ['Subir PDF', 'Crear perfil', 'Generar topics'];

export default function CvPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [level, setLevel] = useState('JUNIOR');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [mediaId, setMediaId] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setProfile(null);
    setMediaId('');
    setActiveStep(0);

    try {
      const media = await mediaApi.uploadMedia({
        file,
        resourceType: 'PDF',
        ownerId: user.userId || user.id,
      });
      setMediaId(media.mediaId);
      setActiveStep(1);

      const createdProfile = await candidateApi.createProfileFromCv({
        userId: user.userId || user.id,
        mediaId: media.mediaId,
        targetRole: targetRole || undefined,
        level,
      });
      setActiveStep(3);
      setProfile(createdProfile);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="CV"
        title="Carga de CV"
        description="Sube tu CV en PDF. El frontend usa API Gateway para cargar el archivo y crear el perfil en candidate-service."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <FileUploadCard
          title="Nuevo perfil desde CV"
          description="El PDF no requiere entrevista asociada. El video se subira solo al finalizar una entrevista."
          accept="application/pdf"
          file={file}
          onFileChange={setFile}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <Input id="targetRole" label="Rol objetivo" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Backend Developer" />
            <Select id="level" label="Nivel" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
            </Select>
            <Button type="submit" disabled={!file || loading}>
              {loading ? 'Procesando CV...' : 'Subir y crear perfil'}
            </Button>
          </form>
        </FileUploadCard>

        <Card>
          <CardHeader title="Progreso" description={mediaId ? `mediaId: ${mediaId}` : 'Listo para cargar un PDF'} />
          <CardBody className="space-y-5">
            <UploadProgress steps={steps} activeStep={activeStep} />
            <div className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Cuando el perfil termine, podras revisarlo en `/profile` y crear entrevistas adaptativas desde `/interviews/new`.
            </div>
          </CardBody>
        </Card>
      </div>

      {profile ? (
        <div className="mt-5 space-y-4">
          <Alert tone="success" title="Perfil generado">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>El CV fue procesado correctamente.</span>
              <Link className="font-semibold text-emerald-800 underline" to="/profile">Ver perfil</Link>
            </div>
          </Alert>
          <ProfileSummaryCard profile={profile} />
        </div>
      ) : null}

      <Card className="mt-5">
        <CardHeader title="Flujo conectado" description="Endpoints usados en esta fase." />
        <CardBody className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          {['POST /media/upload', 'POST /candidates/profile/from-cv', 'GET /me/profile'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <code>{item}</code>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
