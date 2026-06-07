import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authApi } from '../../api/authApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import AuthShell from './AuthShell.jsx';

export default function VerifyEmailSentPage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email) return;
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const result = await authApi.resendVerification(email);
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message || 'No pudimos reenviar el correo. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Revisa tu correo" description="Enviamos un enlace para activar tu cuenta.">
      <div className="space-y-5 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-brand-600" />
        <p className="text-sm leading-6 text-slate-600">
          Abre el enlace enviado a <strong>{email || 'tu correo electrónico'}</strong>. También revisa la carpeta de correo no deseado.
        </p>
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button variant="secondary" className="w-full" onClick={resend} disabled={!email || loading}>
          {loading ? 'Enviando...' : 'Reenviar correo'}
        </Button>
        <Link className="block text-sm font-semibold text-brand-700" to="/login">Volver a ingresar</Link>
      </div>
    </AuthShell>
  );
}
