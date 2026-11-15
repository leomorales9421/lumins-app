import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import AmbientBackground from '../components/layout/AmbientBackground';
import BrandLogo from '../components/ui/BrandLogo';
import { LuminsLogoLoader } from '../components/ui/LuminsLogoLoader';
import { LuminsSuccessIcon } from '../components/icons/LuminsIcons';
import { OtpInput } from '../components/auth/OtpInput';
import { CountryPhoneInput, type CountryOption, COUNTRIES_LIST } from '../components/auth/CountryPhoneInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../lib/api-client';

const LEGAL_BASE_URL = (import.meta.env.VITE_LEGAL_BASE_URL || 'https://lumins.tech').replace(/\/$/, '');

export type LoginStep = 'EMAIL' | 'PASSWORD' | 'FORGOT_PASSWORD' | 'FORGOT_PASSWORD_SUCCESS' | 'OTP' | 'PROFILE';

interface LoginPageProps {
  initialStep?: LoginStep;
}

const LoginPage: React.FC<LoginPageProps> = ({ initialStep }) => {
  const { login, initiateAuth, verifyOtp, completeProfile, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Detect if route is forgot-password on mount
  const isDirectForgot = typeof window !== 'undefined' && window.location.pathname.includes('/forgot-password');

  // Step state
  const [currentStep, setCurrentStep] = useState<LoginStep>(
    initialStep || (isDirectForgot ? 'FORGOT_PASSWORD' : 'EMAIL')
  );

  // Form Fields
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('email')?.trim() || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');

  // OTP & New User Profiling Fields
  const [otpCode, setOtpCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES_LIST[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI States
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveRedirectTarget = () => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    const storedRedirect = localStorage.getItem('lumins_post_login_redirect');
    const target = redirectParam || storedRedirect || '/app';
    if (target.startsWith('/b/')) {
      return target.replace(/^\/b\//, '/boards/');
    }
    return target;
  };

  const redirectToTarget = (target: string) => {
    try {
      localStorage.removeItem('lumins_post_login_redirect');
    } catch (e) {
      // ignore
    }

    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.location.href = target;
      return;
    }

    navigate(target, { replace: true });
  };

  // Check URL OAuth errors and authenticated state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const urlMessage = params.get('message');

    if (urlMessage) {
      setError(decodeURIComponent(urlMessage));
    } else if (urlError) {
      if (urlError === 'oauth_expired' || urlError === 'oauth_invalid_transaction') {
        setError('La sesión con Google expiró o ya fue completada. Intenta ingresar nuevamente.');
      } else if (urlError === 'oauth_mismatch') {
        setError('Conflicto de sesión detectado. Por favor presiona Iniciar con Google nuevamente.');
      } else {
        setError('No se pudo completar el inicio de sesión con Google. Intenta de nuevo.');
      }
    }

    if (!isLoading && isAuthenticated) {
      redirectToTarget(resolveRedirectTarget());
    }
  }, [isLoading, isAuthenticated]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-sans overflow-hidden bg-[#FAFAFA] dark:bg-[#14171C]">
        <AmbientBackground />
        <div className="relative z-10">
          <LuminsLogoLoader size="lg" />
        </div>
      </div>
    );
  }

  // STEP 1: Email Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await initiateAuth(email);

      // Auto-detect country
      if (result.geo) {
        const matched = COUNTRIES_LIST.find((c) => c.code === result.geo.code);
        if (matched) {
          setSelectedCountry(matched);
        } else {
          setSelectedCountry({
            code: result.geo.code,
            name: result.geo.name,
            dialCode: result.geo.dialCode,
            flag: result.geo.flag,
          });
        }
      }

      if (result.exists) {
        setExistingUserName(result.user?.name || '');
        setCurrentStep('PASSWORD');
      } else {
        setCurrentStep('OTP');
        setResendCooldown(30);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al verificar correo');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2A: Password Submit (Existing user)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
      redirectToTarget(resolveRedirectTarget());
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Contraseña incorrecta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2B: Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setCurrentStep('FORGOT_PASSWORD_SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Ocurrió un error al enviar el enlace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2C: Verify OTP (For new user or passwordless)
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await verifyOtp(email, code);

      if (result.isNewUser && result.registrationToken) {
        setRegistrationToken(result.registrationToken);
        setCurrentStep('PROFILE');
      } else {
        redirectToTarget(resolveRedirectTarget());
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Código incorrecto o expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setError('');
    try {
      await initiateAuth(email);
      setResendCooldown(45);
      setOtpCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reenviar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Complete Profile (New user)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Por favor introduce tu nombre');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const fullPhone = phoneNumber.trim() ? `${selectedCountry.dialCode}${phoneNumber.trim()}` : undefined;

      await completeProfile({
        registrationToken,
        name: fullName,
        country: selectedCountry.code,
        phone: fullPhone,
        password: newPassword || undefined,
      });

      redirectToTarget(resolveRedirectTarget());
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:p-6 relative font-sans overflow-x-hidden bg-white sm:bg-transparent">
      <div className="hidden sm:block">
        <AmbientBackground />
      </div>

      <div 
        className="w-full max-w-[1000px] sm:min-h-[620px] bg-white sm:border sm:border-slate-200/80 sm:rounded-[20px] sm:shadow-2xl sm:shadow-slate-300/40 flex flex-col md:flex-row overflow-hidden relative z-10 min-h-screen sm:min-h-0"
      >
        {/* LEFT PANEL: Modern Professional Lumins Brand Sidebar */}
        <div className="hidden md:flex flex-1 bg-[#05040A] p-12 lg:p-14 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Luminous Mesh Gradient matching landing */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(18, 169, 168, 0.24) 0%, transparent 55%),
                radial-gradient(circle at 85% 85%, rgba(255, 204, 64, 0.16) 0%, transparent 50%),
                radial-gradient(circle at 75% 25%, rgba(255, 102, 94, 0.12) 0%, transparent 45%)
              `
            }} 
          />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <BrandLogo size="md" variant="light-text" />
          </div>

          {/* Central Hero Tagline */}
          <div className="relative z-10 my-auto py-8">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight tracking-tight text-white">
              Productividad <br />
              <span className="text-[#12A9A8]">sin límites.</span>
            </h1>

            <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-xs mb-8">
              Gestiona tus proyectos con una interfaz profesional diseñada para la agilidad y el alto rendimiento.
            </p>

            {/* Feature Highlights with Brand Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#12A9A8]" />
                <span className="font-medium">Tableros Kanban ágiles y personalizables</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#FFCC40]" />
                <span className="font-medium">Calendario y fechas sincronizadas en vivo</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#FF665E]" />
                <span className="font-medium">Roles, métricas y control de acceso</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="relative z-10 flex items-center gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Lumins</span>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/privacidad`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacidad</a>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/terminos`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Progressive Steps */}
        <div className="flex-1 md:flex-[1.2] p-8 sm:p-10 md:p-14 lg:p-16 bg-white flex flex-col justify-center min-h-screen sm:min-h-0">
          
          {/* Mobile Logo Branding */}
          <div className="md:hidden flex justify-center mb-8">
            <BrandLogo size="md" />
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: ONLY EMAIL ENTRY */}
            {currentStep === 'EMAIL' && (
              <motion.div
                key="login-step-email"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="mb-8 text-left">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Ingresa a Lumins
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    Tu centro de operaciones inteligente
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">Correo electrónico</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg pl-9 pr-3 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
                        placeholder="ejemplo@correo.com"
                        autoComplete="email"
                        inputMode="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="h-9 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Verificando...' : 'Continuar con correo'}
                  </Button>

                  <div className="flex items-center gap-3 py-0.5">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">o continúa con</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {/* Google OAuth */}
                  <button 
                    type="button"
                    onClick={() => {
                      const redirect = resolveRedirectTarget();
                      localStorage.setItem('lumins_post_login_redirect', redirect);
                      const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
                      const googleAuthUrl = new URL(`${baseApiUrl}/api/auth/google`);
                      googleAuthUrl.searchParams.set('redirect', redirect);
                      window.location.href = googleAuthUrl.toString();
                    }}
                    className="h-9 border border-slate-200 bg-white rounded-lg text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-xs"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>

                  <p className="mt-3 text-xs text-slate-500 text-center">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="text-[#12A9A8] font-bold hover:underline">
                      Regístrate gratis
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}

            {/* STEP 2A: PASSWORD ENTRY (EXISTING USER) */}
            {currentStep === 'PASSWORD' && (
              <motion.div
                key="login-step-password"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('EMAIL');
                    setPassword('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar correo</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {existingUserName ? `Hola, ${existingUserName.split(' ')[0]}` : 'Bienvenido de nuevo'}
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1.5">
                    Introduce la contraseña para <span className="font-bold text-slate-800">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between ml-0.5">
                      <label className="text-xs font-bold text-slate-700">Contraseña</label>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setCurrentStep('FORGOT_PASSWORD');
                          try {
                            window.history.pushState(null, '', '/forgot-password');
                          } catch {}
                        }}
                        className="text-[12px] font-bold text-[#12A9A8] hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg pl-9 pr-9 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="h-9 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2B: FORGOT PASSWORD */}
            {currentStep === 'FORGOT_PASSWORD' && (
              <motion.div
                key="login-step-forgot"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setCurrentStep(password || existingUserName ? 'PASSWORD' : 'EMAIL');
                    try {
                      window.history.pushState(null, '', '/login');
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a iniciar sesión</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Introduce tu correo y te enviaremos las instrucciones para restablecerla.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">Correo electrónico</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg pl-9 pr-3 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
                        placeholder="ejemplo@correo.com"
                        autoComplete="email"
                        inputMode="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    isLoading={isSubmitting}
                    className="h-9 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2C: FORGOT PASSWORD SUCCESS */}
            {currentStep === 'FORGOT_PASSWORD_SUCCESS' && (
              <motion.div
                key="login-step-forgot-success"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="mb-6 text-center">
                  <div className="w-14 h-14 bg-[#12A9A8]/10 border border-[#12A9A8]/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <LuminsSuccessIcon size={28} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                    ¡Revisa tu bandeja de entrada!
                  </h2>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Hemos enviado las instrucciones para restablecer tu contraseña a <strong className="text-slate-800 font-semibold">{email}</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setCurrentStep('EMAIL');
                      setError('');
                      try {
                        window.history.pushState(null, '', '/login');
                      } catch {}
                    }}
                    className="h-9 bg-[#12A9A8] hover:bg-[#0E8786] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al inicio de sesión</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('FORGOT_PASSWORD');
                      setError('');
                    }}
                    className="h-9 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Probar con otro correo
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OTP VERIFICATION (NEW USER) */}
            {currentStep === 'OTP' && (
              <motion.div
                key="login-step-otp"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('EMAIL');
                    setOtpCode('');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar correo</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Revisa tu correo
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1.5 leading-relaxed">
                    Hemos enviado un código de 6 dígitos a <span className="font-bold text-slate-800">{email}</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <OtpInput
                    value={otpCode}
                    onChange={(code) => {
                      setOtpCode(code);
                      setError('');
                    }}
                    onComplete={(code) => handleVerifyOtp(code)}
                    disabled={isSubmitting}
                  />

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    isLoading={isSubmitting}
                    disabled={otpCode.length !== 6}
                    className="h-9 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Verificando código...' : 'Verificar y continuar'}
                  </Button>

                  <div className="text-center pt-1">
                    <p className="text-xs text-slate-500">
                      ¿No recibiste el código?{' '}
                      {resendCooldown > 0 ? (
                        <span className="text-slate-400 font-semibold">Reenviar en {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSubmitting}
                          className="text-[#12A9A8] font-bold hover:underline"
                        >
                          Reenviar código
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PROFILE COMPLETION (NEW USER) */}
            {currentStep === 'PROFILE' && (
              <motion.div
                key="login-step-profile"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Correo verificado</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Completa tu perfil
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    Un último paso para ingresar a tus tableros.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
                  <div className="flex gap-2.5">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-bold text-slate-700 ml-0.5">Nombre</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Leonardo"
                        autoComplete="given-name"
                        autoFocus
                        required
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-bold text-slate-700 ml-0.5">Apellido</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Morales"
                        autoComplete="family-name"
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all"
                      />
                    </div>
                  </div>

                  <CountryPhoneInput
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                  />

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center ml-0.5">
                      <label className="text-xs font-bold text-slate-700">Contraseña de acceso</label>
                      <span className="text-[11px] text-slate-400 font-medium">(mínimo 8 caracteres)</span>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-lg pl-9 pr-9 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="mt-2 h-9 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Guardando...' : 'Comenzar a usar Lumins'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
