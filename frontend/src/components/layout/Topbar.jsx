import { LogOut, Menu } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../features/auth/useAuth.js';

export default function Topbar() {
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Candidato';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button className="focus-ring rounded-md p-2 text-slate-500 lg:hidden" type="button" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-950">{displayName}</p>
          <p className="text-xs text-slate-500">{user?.role || 'CANDIDATE'}</p>
        </div>
      </div>
      <Button variant="secondary" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Salir
      </Button>
    </header>
  );
}
