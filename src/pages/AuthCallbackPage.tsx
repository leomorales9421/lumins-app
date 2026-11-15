import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import LuminsLogoLoader from '../components/ui/LuminsLogoLoader';
import AmbientBackground from '../components/layout/AmbientBackground';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasRun = React.useRef(false);
  
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      // Check for Trello token in hash fragment (#token=...)
      const hash = window.location.hash;
      if (hash && hash.includes('token=')) {
        const trelloToken = hash.split('token=')[1];
        if (trelloToken) {
          localStorage.setItem('trello_token', trelloToken);
          // Close the window if it's a popup, otherwise redirect
          if (window.opener) {
            window.close();
          } else {
            navigate('/app', { replace: true });
          }
          return;
        }
      }

      try {
        const refreshResponse = await apiClient.post<{ data: { accessToken: string } }>('/api/auth/refresh', {});
        apiClient.setTokens(refreshResponse.data.accessToken);
        
        // Refresh the user context to sync with the new token
        await refreshUser();

        const queryParams = new URLSearchParams(window.location.search);
        const queryRedirect = queryParams.get('redirect');
        const postLoginRedirect = queryRedirect || localStorage.getItem('lumins_post_login_redirect');
        if (postLoginRedirect) {
          localStorage.removeItem('lumins_post_login_redirect');
          if (
            postLoginRedirect.startsWith('http://') ||
            postLoginRedirect.startsWith('https://')
          ) {
            window.location.href = postLoginRedirect;
            return;
          }

          const target = postLoginRedirect.startsWith('/b/')
            ? postLoginRedirect.replace(/^\/b\//, '/boards/')
            : postLoginRedirect;

          navigate(target, { replace: true });
          return;
        }
        
        // Redirect to dashboard
        navigate('/app', { replace: true });
      } catch (error) {
        console.error('Failed to handle auth callback:', error);
        navigate('/login?error=auth_failed');
      }
    };
    
    handleCallback();
  }, [navigate, refreshUser]);


  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-5 sm:p-6 relative font-sans overflow-hidden bg-[#FAFAFA] dark:bg-[#14171C]">
      <AmbientBackground />
      <div className="w-full max-w-[380px] bg-white/90 dark:bg-[#1C1F26]/90 backdrop-blur-xl border border-[#E5E7EB]/80 dark:border-white/10 rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/40 px-7 py-10 sm:px-10 sm:py-12 flex flex-col items-center justify-center relative z-10 text-center">
        <div className="mb-7">
          <LuminsLogoLoader size="lg" />
        </div>
        <h2 className="text-xl font-bold text-[#111827] dark:text-[#F3F4F6] mb-2 tracking-tight">
          Preparando espacio...
        </h2>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-[260px]">
          Estamos verificando tu cuenta y preparando tu entorno de trabajo.
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
