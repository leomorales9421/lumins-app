import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { motion } from 'framer-motion';
import { ArrowRight, User } from 'lucide-react';
import Cookies from 'js-cookie';
import BrandLogo from '../components/ui/BrandLogo';
import LuminsLogoLoader from '../components/ui/LuminsLogoLoader';
import {
  LuminsMembersIcon,
  LuminsSuccessIcon,
  LuminsWarningIcon,
} from '../components/icons/LuminsIcons';

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
  const [successRedirectPath, setSuccessRedirectPath] = useState<string>('/app');

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

        const targets = Array.isArray(data?.targetId) ? data.targetId : [];
        const singleBoardTarget =
          targets.length === 1 && targets[0]?.type === 'BOARD' && targets[0]?.id
            ? `/boards/${targets[0].id}`
            : '/app';
        setSuccessRedirectPath(singleBoardTarget);

        // If already accepted, just show success or redirect
        if (data.isAlreadyAccepted) {
          Cookies.remove('invitation_token');
          setStatus('success');
          setMessage('Ya eres miembro de este equipo. Redirigiendo...');
          setTimeout(() => navigate(singleBoardTarget), 2000);
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
          navigate(singleBoardTarget);
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
    <div className="min-h-[100dvh] bg-[#F4F6F9] dark:bg-[#13151A] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Subtle Lumins ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-35"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 20%, rgba(18, 169, 168, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 82% 80%, rgba(255, 204, 64, 0.12) 0%, transparent 45%)
          `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-md w-full bg-white dark:bg-[#1C1F26] rounded-[24px] shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden text-center z-10"
      >
        {/* Barra tricolor Lumins */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF665E] via-[#12A9A8] to-[#FFCC40]" />

        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-5">
            <BrandLogo size="sm" />
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-[#12A9A8]/12 dark:bg-[#12A9A8]/20 border border-[#12A9A8]/25 rounded-2xl flex items-center justify-center">
              <LuminsMembersIcon size={28} />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight mb-1.5">
            Invitación de Equipo
          </h1>

          <div className="my-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <LuminsLogoLoader size="sm" />
                <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#12A9A8]/12 dark:bg-[#12A9A8]/20 border border-[#12A9A8]/25 flex items-center justify-center">
                  <LuminsSuccessIcon size={30} />
                </div>
                <p className="text-sm text-slate-700 dark:text-zinc-200 font-medium leading-relaxed">
                  {message}
                </p>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#12A9A8] to-[#4ED4D2] rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Redirigiendo a tu espacio de trabajo...
                </p>
              </div>
            )}

            {status === 'mismatch' && inviteData && (
              <div className="flex flex-col items-center gap-5">
                <div className="w-14 h-14 bg-[#FF665E]/12 border border-[#FF665E]/25 rounded-2xl flex items-center justify-center">
                  <LuminsWarningIcon size={28} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-slate-700 dark:text-zinc-200 font-medium">
                    Esta invitación es para{' '}
                    <span className="text-[#0E8786] dark:text-[#4ED4D2] font-bold">
                      {inviteData.email}
                    </span>.
                  </p>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs">
                    Actualmente estás logueado como{' '}
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">
                      {user?.email}
                    </span>.
                  </p>
                </div>

                <div className="w-full space-y-2.5 pt-2">
                  <button
                    onClick={handleLogoutAndSwitch}
                    className="w-full h-11 sm:h-10 bg-[#12A9A8] hover:bg-[#0E8786] text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-[#12A9A8]/20 cursor-pointer"
                  >
                    <User size={16} />
                    <span>Cambiar de cuenta</span>
                  </button>
                  <Link
                    to="/app"
                    className="w-full h-10 text-xs text-slate-500 dark:text-zinc-400 font-semibold hover:text-slate-800 dark:hover:text-zinc-200 transition-all flex items-center justify-center gap-2"
                  >
                    Continuar como {user?.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-[#FF665E]/12 border border-[#FF665E]/25 rounded-2xl flex items-center justify-center">
                  <LuminsWarningIcon size={28} />
                </div>
                <p className="text-sm text-slate-700 dark:text-zinc-200 font-medium leading-relaxed">
                  {message}
                </p>
                <Link
                  to="/app"
                  className="mt-2 inline-flex items-center gap-2 h-11 sm:h-10 px-5 rounded-xl bg-[#12A9A8] hover:bg-[#0E8786] text-white text-sm font-bold shadow-md shadow-[#12A9A8]/20 transition-all active:scale-[0.98]"
                >
                  <span>Ir a mi panel</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>

          {status === 'success' && (
            <button
              onClick={() => navigate(successRedirectPath)}
              className="w-full h-11 sm:h-10 bg-[#12A9A8] hover:bg-[#0E8786] text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[#12A9A8]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{successRedirectPath.startsWith('/boards/') ? 'Ir al tablero ahora' : 'Ir al Dashboard ahora'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InvitePage;
