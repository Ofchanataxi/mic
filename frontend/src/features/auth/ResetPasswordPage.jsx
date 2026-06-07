import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi.js';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getApiErrorMessage } from '../../utils/formatters.js';
import AuthShell from './AuthShell.jsx';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ token, password: form.password });
      setSuccess(true);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Nueva contraseña" description="Crea una contraseña segura para tu cuenta.">
      {success ? (
        <div className="space-y-4">
          <Alert tone="success">Tu contraseña fue actualizada.</Alert>
          <Link className="block text-center font-semibold text-brand-700" to="/login">Ingresar</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input label="Nueva contraseña" type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          <Input label="Confirmar contraseña" type="password" minLength={8} value={form.confirmation} onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))} required />
          <Button type="submit" className="w-full" disabled={!token || loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
