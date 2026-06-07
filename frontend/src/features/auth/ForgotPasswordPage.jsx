import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import AuthShell from './AuthShell.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.forgotPassword(email);
      setMessage(result.message);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar contraseña" description="Te enviaremos un enlace seguro para crear una nueva contraseña.">
      <form className="space-y-4" onSubmit={submit}>
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input label="Correo electrónico" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>
      <Link className="mt-6 block text-center text-sm font-semibold text-brand-700" to="/login">Volver a ingresar</Link>
    </AuthShell>
  );
}
