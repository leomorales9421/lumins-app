import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './components/NotificationProvider';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/layout/MainLayout';
import { useEffect, useState, lazy, Suspense } from 'react';
import apiClient from './lib/api-client';
import { GlobalToaster } from './components/GlobalToaster';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Pages
const BoardsPage = lazy(() => import('./pages/BoardsPage'));
const BoardDetailPage = lazy(() => import('./pages/BoardDetailPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const WorkspaceActivityPage = lazy(() => import('./pages/WorkspaceActivityPage'));
const WorkspaceCalendarPage = lazy(() => import('./pages/WorkspaceCalendarPage'));
const SystemAdminPage = lazy(() => import('./pages/SystemAdminPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfileSettings = lazy(() => import('./pages/settings/ProfileSettings'));
const SecuritySettings = lazy(() => import('./pages/settings/SecuritySettings'));
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));
const PreferenceSettings = lazy(() => import('./pages/settings/PreferenceSettings'));
const IntegrationsSettings = lazy(() => import('./pages/settings/IntegrationsSettings'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

const PageLoader = () => (
  <div className="flex-1 h-screen flex flex-col items-center justify-center bg-[#F4F6F9] dark:bg-[#13151A] text-[#6C5DD3]">
    <Loader2 className="animate-spin mb-4" size={48} />
    <span className="text-sm font-bold uppercase tracking-widest animate-pulse">Cargando Lumins...</span>
  </div>
);

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

const GlobalInvitationDetector: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;

    const inviteToken = Cookies.get('invitation_token');
    const currentPath = window.location.pathname;

    // If we have a token and we are NOT already on the invite page, redirect to it
    if (inviteToken && currentPath !== '/invite') {
      navigate(`/invite?token=${inviteToken}`, { replace: true });
    }
  }, [user, isLoading, navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PermissionProvider>
          <SocketProvider>
            <GlobalInvitationDetector />
            <NotificationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/invite" element={<InvitePage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  
                  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/app" element={<BoardsPage />} />
                    <Route path="/w/:workspaceId/dashboard" element={<BoardsPage />} />
                    <Route path="/w/:workspaceId/members" element={<MembersPage />} />
                    <Route path="/w/:workspaceId/activity" element={<WorkspaceActivityPage />} />
                    <Route path="/w/:workspaceId/calendar" element={<WorkspaceCalendarPage />} />
                    <Route path="/w/:workspaceId/system-admin" element={<SystemAdminPage />} />
                    <Route path="/boards/:id" element={<BoardDetailPage />} />
                    
                    <Route path="/settings" element={<SettingsPage />}>
                      <Route index element={<Navigate to="profile" replace />} />
                      <Route path="profile" element={<ProfileSettings />} />
                      <Route path="security" element={<SecuritySettings />} />
                      <Route path="notifications" element={<NotificationSettings />} />
                      <Route path="integrations" element={<IntegrationsSettings />} />
                      <Route path="preferences" element={<PreferenceSettings />} />
                    </Route>
                  </Route>

                  <Route path="/calendar" element={<ProtectedRoute><WorkspaceRedirect to="calendar" /></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute><WorkspaceRedirect to="activity" /></ProtectedRoute>} />
                  <Route path="/members" element={<ProtectedRoute><WorkspaceRedirect to="members" /></ProtectedRoute>} />

                  <Route path="/" element={<Navigate to="/app" replace />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </Routes>
              </Suspense>
              <GlobalToaster />
            </NotificationProvider>
          </SocketProvider>
        </PermissionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
