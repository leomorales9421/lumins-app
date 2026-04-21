import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/NotificationProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransitionWrapper from './components/PageTransitionWrapper';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardDetailPage from './pages/BoardDetailPage';
import InvitePage from './pages/InvitePage';
import MembersPage from './pages/MembersPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WorkspaceActivityPage from './pages/WorkspaceActivityPage';
import WorkspaceCalendarPage from './pages/WorkspaceCalendarPage';

import MainLayout from './components/layout/MainLayout';
import SettingsPage from './pages/SettingsPage';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import NotificationSettings from './pages/settings/NotificationSettings';
import PreferenceSettings from './pages/settings/PreferenceSettings';
import { useEffect, useState } from 'react';
import apiClient from './lib/api-client';
import { GlobalToaster } from './components/GlobalToaster';

const WorkspaceRedirect: React.FC<{ to: string }> = ({ to }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performRedirect = async () => {
      try {
        const response = await apiClient.get<{ data: { workspaces: { id: string }[] } }>('/api/workspaces');
        const workspaces = response.data.workspaces || [];
        
        if (workspaces.length > 0) {
          const lastId = localStorage.getItem('lastActiveWorkspaceId');
          const targetId = workspaces.find(w => w.id === lastId)?.id || workspaces[0].id;
          navigate(`/w/${targetId}/${to}`, { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } catch (err) {
        navigate('/app', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    performRedirect();
  }, [navigate, to]);

  if (loading) return null;
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/invite" element={<InvitePage />} />
            
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/app" element={<BoardsPage />} />
              <Route path="/w/:workspaceId/dashboard" element={<BoardsPage />} />
              <Route path="/w/:workspaceId/members" element={<MembersPage />} />
              <Route path="/w/:workspaceId/activity" element={<WorkspaceActivityPage />} />
              <Route path="/w/:workspaceId/calendar" element={<WorkspaceCalendarPage />} />
              <Route path="/boards/:id" element={<BoardDetailPage />} />
              
              <Route path="/settings" element={<SettingsPage />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="notifications" element={<NotificationSettings />} />
                <Route path="preferences" element={<PreferenceSettings />} />
              </Route>
            </Route>

            <Route path="/calendar" element={<ProtectedRoute><WorkspaceRedirect to="calendar" /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><WorkspaceRedirect to="activity" /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><WorkspaceRedirect to="members" /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
          <GlobalToaster />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
