import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Users, ArrowRight, ShieldAlert, LogOut, User } from 'lucide-react';
import Cookies from 'js-cookie';

interface InvitationData {
  email: string;
  inviterName: string;
  targetId: any[];
  expiresAt: string;
  isRegistered: boolean;
}

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'mismatch'>('loading');
  const [message, setMessage] = useState('Verificando tu invitación...');
  const [inviteData, setInviteData] = useState<InvitationData | null>(null);

  useEffect(() => {
    const processInvitation = async () => {
      const token = tokenFromUrl || Cookies.get('invitation_token');

      if (!token) {
        setStatus('error');
        setMessage('El enlace de invitación no es válido o no se encontró ningún token.');
        return;
      }

      try {
        // 1. Fetch invitation metadata (Public)
        const response = await apiClient.get<any>(`/api/invitations/${token}`);
        
        if (!response.success) {
          setStatus('error');
          setMessage(response.message || 'Esta invitación ya no es válida.');
          return;
        }

        const data = response.data;
        setInviteData(data);

        // If already accepted, just show success or redirect
        if (data.isAlreadyAccepted) {
          setStatus('success');
          setMessage('Ya eres miembro de este equipo. Redirigiendo al dashboard...');
          setTimeout(() => navigate('/app'), 2000);
          return;
        }

        // 2. Handle Authentication State
        if (isAuthLoading) return;

        if (!user) {
          // Store token in cookie and redirect
          Cookies.set('invitation_token', token, { expires: 7 });
          setStatus('loading');
          
          const path = data.isRegistered ? '/login' : '/register';
          setMessage(`Invitación detectada. Redirigiendo a ${data.isRegistered ? 'inicio de sesión' : 'registro'}...`);
          
          // Redirect to login or register with redirect back to this page
          setTimeout(() => {
            navigate(`${path}?redirect=/invite?token=${token}`);
          }, 1500);
          return;
        }

        // 3. Handle Email Mismatch
        if (user.email.toLowerCase() !== data.email.toLowerCase()) {
          setStatus('mismatch');
          return;
        }

        // 4. Accept Invitation (Automatic if email matches)
        setStatus('loading');
        setMessage('Uniendo tu cuenta al equipo...');
        
        await apiClient.post('/api/invitations/accept', { token });
        
        setStatus('success');
        setMessage(`¡Listo! Ahora tienes acceso a los recursos compartidos por ${data.inviterName}.`);
        Cookies.remove('invitation_token');
        
        // Auto redirect after success
        setTimeout(() => {
          navigate('/app');
        }, 3000);

      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Error al procesar la invitación. Es posible que el enlace haya expirado.');
      }
    };

    processInvitation();
  }, [tokenFromUrl, user, isAuthLoading, navigate]);

  const handleLogoutAndSwitch = async () => {
    await logout();
    const token = tokenFromUrl || Cookies.get('invitation_token');
    const path = inviteData?.isRegistered ? '/login' : '/register';
    navigate(`${path}?redirect=/invite?token=${token}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-zinc-100"
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
              <p className="text-xs text-zinc-400 mt-2">Redirigiendo a tu espacio de trabajo...</p>
            </div>
          )}

          {status === 'mismatch' && inviteData && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-600 font-medium">
                  Esta invitación es para <span className="text-[#4338ca] font-bold">{inviteData.email}</span>.
                </p>
                <p className="text-zinc-500 text-sm">
                  Actualmente estás logueado como <span className="font-semibold text-zinc-700">{user?.email}</span>.
                </p>
              </div>
              
              <div className="w-full space-y-3 pt-4">
                <button 
                  onClick={handleLogoutAndSwitch}
                  className="w-full bg-[#4338ca] text-white font-bold py-3 rounded-xl hover:bg-[#312e81] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4338ca]/20"
                >
                  <User size={18} /> Cambiar de cuenta
                </button>
                <Link 
                  to="/app"
                  className="w-full py-3 text-zinc-500 font-medium hover:text-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  Continuar como {user?.name.split(' ')[0]}
                </Link>
              </div>
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
                Ir a mi Dashboard <ArrowRight size={16} />
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
