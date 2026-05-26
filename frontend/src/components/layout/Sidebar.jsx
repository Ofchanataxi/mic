import { ClipboardList, FileText, History, LayoutDashboard, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cv', label: 'CV', icon: FileText },
  { to: '/profile', label: 'Perfil', icon: UserRound },
  { to: '/interviews/new', label: 'Entrevista', icon: ClipboardList },
  { to: '/history', label: 'Historial', icon: History },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <div>
          <p className="text-lg font-bold text-slate-950">MIC Interviews</p>
          <p className="text-xs text-slate-500">Technical assessment</p>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
