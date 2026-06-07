import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import AuthShell from './AuthShell.jsx';
import { useAuth } from './useAuth.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setEmailNotVerified(false);
    try {
      await login(form);
      navigate('/inicio', { replace: true });
    } catch (apiError) {
      setEmailNotVerified(apiError?.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED');
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Ingresar" description="Usa tu cuenta para continuar con tu proceso de entrevista.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <Alert tone="error">
            {error}
            {emailNotVerified && form.email ? (
              <Link
                className="mt-2 block font-semibold underline"
                to={`/verify-email-sent?email=${encodeURIComponent(form.email)}`}
              >
                Reenviar correo de verificación
              </Link>
            ) : null}
          </Alert>
        ) : null}
        <Input id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        <div>
          <Input id="password" name="password" label="Contraseña" type="password" autoComplete="current-password" value={form.password} onChange={updateField} required />
          <div className="mt-2 text-right">
            <Link className="text-sm font-semibold text-brand-700 hover:text-brand-600" to="/forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/register">
          Crear cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
