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

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Ingresar" description="Usa tu cuenta para continuar con tu proceso de entrevista.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        <Input id="password" name="password" label="Contraseña" type="password" autoComplete="current-password" value={form.password} onChange={updateField} required />
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
