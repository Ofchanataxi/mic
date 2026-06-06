import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import PublicRoute from '../features/auth/PublicRoute.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import ProfilePage from '../features/candidate/ProfilePage.jsx';
import CvPage from '../features/candidate/CvPage.jsx';
import NewInterviewPage from '../features/interview/NewInterviewPage.jsx';
import InterviewSessionPage from '../features/interview/InterviewSessionPage.jsx';
import ProcessingPage from '../features/interview/ProcessingPage.jsx';
import FeedbackPage from '../features/feedback/FeedbackPage.jsx';
import HistoryPage from '../features/history/HistoryPage.jsx';
import { useAuth } from '../features/auth/useAuth.js';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/inicio' : '/login'} replace />;
}

export function RouterProvider() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/inicio" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cv" element={<CvPage />} />
          <Route path="/interviews/new" element={<NewInterviewPage />} />
          <Route path="/interviews/:id/session" element={<InterviewSessionPage />} />
          <Route path="/interviews/:id/processing" element={<ProcessingPage />} />
          <Route path="/interviews/:id/feedback" element={<FeedbackPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
