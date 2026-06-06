import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import Alert from '../../components/ui/Alert.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import AuthShell from './AuthShell.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthShell title="Verificación de correo" description="Estamos confirmando tu cuenta.">
      {status === 'loading' ? <LoadingState label="Verificando correo" /> : null}
      {status === 'success' ? (
        <div className="space-y-4">
          <Alert tone="success">Tu correo fue verificado correctamente.</Alert>
          <Link className="block text-center font-semibold text-brand-700" to="/login">Ingresar a CCInterview</Link>
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="space-y-4">
          <Alert tone="error">El enlace no es válido o ya venció.</Alert>
          <Link className="block text-center font-semibold text-brand-700" to="/login">Volver a ingresar</Link>
        </div>
      ) : null}
    </AuthShell>
  );
}
