import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateApi } from '../../api/candidateApi.js';
import { mediaApi } from '../../api/mediaApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import FileUploadCard from '../../components/ui/FileUploadCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import UploadProgress from '../../components/ui/UploadProgress.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import { useAuth } from '../auth/useAuth.js';

const steps = ['Subir CV', 'Crear perfil', 'Revisar perfil'];
const PDF_MIME_TYPE = 'application/pdf';

function isPdfFile(file) {
  if (!file) return false;
  return file.type === PDF_MIME_TYPE && file.name.toLowerCase().endsWith('.pdf');
}

export default function CvPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (selectedFile) => {
    setError('');

    if (!selectedFile) {
      setFile(null);
      return true;
    }

    if (!isPdfFile(selectedFile)) {
      setFile(null);
      setError('Selecciona un archivo PDF válido.');
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isPdfFile(file)) {
      setError('Selecciona un archivo PDF válido.');
      return;
    }

    setLoading(true);
    setError('');
    setActiveStep(0);

    try {
      const media = await mediaApi.uploadMedia({
        file,
        resourceType: 'PDF',
        ownerId: user.userId || user.id,
      });
      setActiveStep(1);

      await candidateApi.createProfileFromCv({
        userId: user.userId || user.id,
        mediaId: media.mediaId,
      });

      setActiveStep(3);
      navigate('/profile', { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Carga de Curriculum Vitae"
        description="Sube tu Curriculum Vitae en PDF para preparar tu perfil y personalizar tus entrevistas."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <FileUploadCard
          title="Subir Curriculum Vitae"
          description="Selecciona el archivo PDF que utilizaremos para preparar tu perfil."
          accept={PDF_MIME_TYPE}
          file={file}
          onFileChange={handleFileChange}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <Alert tone="info">
              El puesto objetivo y el nivel se inferirán desde tu Curriculum Vitae. Podrás editarlos antes de iniciar una entrevista.
            </Alert>
            <Button type="submit" disabled={!file || loading}>
              {loading ? 'Procesando Curriculum Vitae...' : 'Subir y crear perfil'}
            </Button>
          </form>
        </FileUploadCard>

        <Card>
          <CardHeader title="Progreso" description={loading ? 'Estamos preparando tu perfil.' : 'Listo para cargar tu Curriculum Vitae.'} />
          <CardBody className="space-y-5">
            <UploadProgress steps={steps} activeStep={activeStep} />
            <div className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Cuando el procesamiento termine, accederás automáticamente a tu perfil.
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
