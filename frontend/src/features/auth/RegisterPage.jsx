import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import AuthShell from './AuthShell.jsx';
import { useAuth } from './useAuth.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
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
      await register(form);
      navigate(`/verify-email-sent?email=${encodeURIComponent(form.email)}`, { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Crear cuenta" description="Registra tus datos para iniciar tus entrevistas.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="firstName" name="firstName" label="Nombre" value={form.firstName} onChange={updateField} required />
          <Input id="lastName" name="lastName" label="Apellido" value={form.lastName} onChange={updateField} required />
        </div>
        <Input id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
        <Input id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateField} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/login">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
