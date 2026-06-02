import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isInterviewSession = /^\/interviews\/[^/]+\/session$/.test(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {isInterviewSession ? null : <Sidebar />}
        <div className="min-w-0 flex-1">
          {isInterviewSession ? null : <Topbar />}
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
