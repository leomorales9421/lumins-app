import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { Loader2 } from 'lucide-react';
import AmbientBackground from '../components/layout/AmbientBackground';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  useEffect(() => {
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

      const token = searchParams.get('token');
      
      if (!token) {
        // If no token in query or hash, redirect to login
        if (!hash) navigate('/login?error=auth_failed');
        return;
      }
      
      try {
        // Set the new access token
        apiClient.setTokens(token);
        
        // Refresh the user context to sync with the new token
        await refreshUser();
        
        // Redirect to dashboard
        navigate('/app', { replace: true });
      } catch (error) {
        console.error('Failed to handle auth callback:', error);
        navigate('/login?error=auth_sync_failed');
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, refreshUser]);


  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans overflow-hidden bg-[#F4F6F9] dark:bg-[#09090B]">
      <AmbientBackground />
      <div className="w-full max-w-[400px] bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-2xl p-10 flex flex-col items-center justify-center relative z-10 text-center">
        <Loader2 className="animate-spin mb-6 text-[#4338ca]" size={48} />
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 tracking-tight">
          Autenticando
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Por favor espera mientras configuramos tu sesión de forma segura...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
