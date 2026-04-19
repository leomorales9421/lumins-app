import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, NotificationContainer } from './components/NotificationProvider';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransitionWrapper from './components/PageTransitionWrapper';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardsPage from './pages/BoardsPage';
import BoardDetailPage from './pages/BoardDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <PageTransitionWrapper>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <BoardsPage />
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
