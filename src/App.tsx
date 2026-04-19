import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, NotificationContainer } from './components/NotificationProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransitionWrapper from './components/PageTransitionWrapper';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardDetailPage from './pages/BoardDetailPage';
import InvitePage from './pages/InvitePage';
import MembersPage from './pages/MembersPage';

import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <PageTransitionWrapper>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/invite" element={<InvitePage />} />
              
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <BoardsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/w/:workspaceId/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <BoardsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/w/:workspaceId/members"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MembersPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/boards/:id"
                element={
                  <ProtectedRoute>
                    <BoardDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
            <NotificationContainer />
          </PageTransitionWrapper>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
