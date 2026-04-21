import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Users, ArrowRight } from 'lucide-react';

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando tu invitación...');

  useEffect(() => {
    if (isAuthLoading) return;

    if (!token) {
      setStatus('error');
      setMessage('El enlace de invitación no es válido o ha expirado.');
      return;
    }

    if (!user) {
      // Store token in session to accept after login
      localStorage.setItem('pending_invite_token', token);
      navigate(`/login?redirect=/invite?token=${token}`);
      return;
    }

    const acceptInvite = async () => {
      try {
        await apiClient.post('/api/invitations/accept', { token });
        setStatus('success');
        setMessage('¡Bienvenido al equipo! Tu invitación ha sido aceptada correctamente.');
        localStorage.removeItem('pending_invite_token');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/app');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Error al procesar la invitación. Es posible que el enlace haya expirado.');
      }
    };

    acceptInvite();
  }, [token, user, isAuthLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#4338ca]/10 rounded-2xl flex items-center justify-center text-[#4338ca]">
            <Users size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Invitación de Equipo</h1>
        
        <div className="my-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#4338ca] animate-spin" />
              <p className="text-zinc-500 font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-zinc-600 font-medium">{message}</p>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="h-1 bg-emerald-500 rounded-full mt-4"
              />
              <p className="text-xs text-zinc-400 mt-2">Redirigiendo al panel de control...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-12 h-12 text-rose-500" />
              <p className="text-zinc-600 font-medium">{message}</p>
              <Link 
                to="/app"
                className="mt-6 flex items-center gap-2 text-[#4338ca] font-bold hover:underline"
              >
                Ir al Inicio <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>

        {status === 'success' && (
          <button 
            onClick={() => navigate('/app')}
            className="w-full bg-[#4338ca] text-white font-bold py-3 rounded-xl hover:bg-[#312e81] transition-all shadow-lg shadow-[#4338ca]/20"
          >
            Ir al Dashboard ahora
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default InvitePage;
