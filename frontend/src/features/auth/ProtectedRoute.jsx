import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner.jsx';
import { useAuth } from './useAuth.js';

export default function ProtectedRoute() {
  const { bootstrapping, isAuthenticated } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Preparando sesion" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
