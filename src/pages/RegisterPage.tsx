import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type GeoInfo } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import AmbientBackground from '../components/layout/AmbientBackground';
import { OtpInput } from '../components/auth/OtpInput';
import { CountryPhoneInput, type CountryOption, COUNTRIES_LIST } from '../components/auth/CountryPhoneInput';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const LEGAL_BASE_URL = (import.meta.env.VITE_LEGAL_BASE_URL || 'https://lumins.tech').replace(/\/$/, '');

type FlowStep = 'EMAIL' | 'OTP' | 'PROFILE' | 'EXISTING_PASSWORD';

const RegisterPage: React.FC = () => {
  // Navigation & Auth
  const { initiateAuth, verifyOtp, completeProfile, login } = useAuth();
  const navigate = useNavigate();

  // Multi-step State
  const [currentStep, setCurrentStep] = useState<FlowStep>('EMAIL');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  
  // Profile Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES_LIST[0]); // Default VE
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Existing User Password
  const [existingUserPassword, setExistingUserPassword] = useState('');
  const [existingUserName, setExistingUserName] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer for OTP resend cooldown
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resolveRedirectTarget = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/app';
  };

  // STEP 1: Submit Email
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

      // Auto-detect country and dialCode
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
        // User already has an account
        setExistingUserName(result.user?.name || '');
        setCurrentStep('EXISTING_PASSWORD');
      } else {
        // New user -> Send to OTP
        setCurrentStep('OTP');
        setResendCooldown(30);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al verificar el correo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP
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
        // Logged in immediately (existing user via OTP)
        navigate(resolveRedirectTarget());
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

  // STEP 3: Complete Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Por favor introduce tu nombre');
      return;
    }

    if (password && password.length < 8) {
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
        password: password || undefined,
      });

      // Redirect to App / Onboarding
      navigate(resolveRedirectTarget());
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Existing user password login
  const handleExistingUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingUserPassword) {
      setError('Por favor introduce tu contraseña');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(email, existingUserPassword);
      navigate(resolveRedirectTarget());
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Contraseña incorrecta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:p-6 relative font-sans overflow-x-hidden bg-white sm:bg-transparent">
      <div className="hidden sm:block">
        <AmbientBackground />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1020px] sm:min-h-[660px] bg-white sm:bg-white/95 sm:backdrop-blur-md sm:border sm:border-white/30 sm:rounded-2xl sm:shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 min-h-screen sm:min-h-0"
      >
        {/* LEFT PANEL: Branding & Visual Experience */}
        <div className="hidden md:flex flex-1 bg-[#09090B] p-14 flex-col justify-between text-white relative overflow-hidden">
          {/* Radial Spotlight Effect */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              background: 'radial-gradient(circle at 50% 35%, rgba(67, 56, 202, 0.28) 0%, rgba(9, 9, 11, 0) 70%)' 
            }} 
          />

          {/* Grain Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <filter id="noiseFilterRegister">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noiseFilterRegister)" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <img src="/lumins-log.webp" alt="Lumins Logo" className="h-9 w-auto object-contain" />
            <span className="brand-logotype text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-indigo-200">
              LUMINS
            </span>
          </div>

          <div className="relative z-10 my-auto py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Espacio de Trabajo Conectado</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-white/95">
              Empieza a <br /> iluminar tus <br /> proyectos.
            </h1>
            <p className="text-base text-white/65 font-medium max-w-sm leading-relaxed">
              Crea tableros intuitivos, sincroniza tus calendarios y colabora en tiempo real con todo tu equipo.
            </p>
          </div>

          {/* Footer Indicators */}
          <div className="relative z-10 flex items-center gap-6 text-xs text-white/40">
            <span>© {new Date().getFullYear()} Lumins</span>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/privacidad`} target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">Privacidad</a>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/terminos`} target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors">Términos</a>
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Step Workflow */}
        <div className="flex-1 md:flex-[1.2] p-8 sm:p-10 md:p-12 lg:p-14 bg-white flex flex-col justify-center min-h-screen sm:min-h-0">
          
          {/* Mobile Logo Branding */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <img src="/lumins-log.webp" alt="Lumins" className="h-12 w-auto drop-shadow-sm mb-2" />
            <span className="brand-logotype text-xl bg-clip-text text-transparent bg-gradient-to-tr from-[#312E81] via-[#4338ca] to-[#7C3AED] font-black tracking-tighter">
              LUMINS
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: EMAIL ENTRY */}
            {currentStep === 'EMAIL' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[420px] mx-auto md:mx-0"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                    Crea tu cuenta o inicia sesión
                  </h2>
                  <p className="text-zinc-500 font-medium text-base mt-2">
                    Introduce tu correo de trabajo o personal para continuar.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-zinc-700 ml-1">Correo electrónico</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu.nombre@empresa.com"
                        className="w-full h-12 bg-[#F4F6F9] border border-transparent rounded-xl pl-10 pr-4 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all placeholder:text-zinc-400"
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="mt-2 h-12 bg-[#4338ca] text-white text-sm font-bold rounded-xl hover:bg-[#3730a3] transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Verificando...' : 'Continuar con correo'}
                  </Button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-zinc-100" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">o continúa con</span>
                    <div className="h-px flex-1 bg-zinc-100" />
                  </div>

                  {/* Google OAuth (Funciona tal cual está) */}
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`;
                    }}
                    className="h-12 bg-white border border-zinc-200 rounded-xl text-zinc-800 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </button>

                  <p className="mt-4 text-[12px] text-zinc-400 text-center leading-relaxed">
                    Al continuar, aceptas nuestros{' '}
                    <a href={`${LEGAL_BASE_URL}/terminos`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 font-semibold underline hover:text-zinc-900">
                      Términos de Servicio
                    </a>{' '}
                    y{' '}
                    <a href={`${LEGAL_BASE_URL}/privacidad`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 font-semibold underline hover:text-zinc-900">
                      Política de Privacidad
                    </a>.
                  </p>
                </form>
              </motion.div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {currentStep === 'OTP' && (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[420px] mx-auto md:mx-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('EMAIL');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar correo</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                    Revisa tu bandeja
                  </h2>
                  <p className="text-zinc-500 font-medium text-sm mt-2 leading-relaxed">
                    Hemos enviado un código de 6 dígitos a <span className="font-bold text-zinc-800">{email}</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-6">
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
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    isLoading={isSubmitting}
                    disabled={otpCode.length !== 6}
                    className="h-12 bg-[#4338ca] text-white text-sm font-bold rounded-xl hover:bg-[#3730a3] transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Verificando código...' : 'Verificar y continuar'}
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-zinc-500">
                      ¿No recibiste el código?{' '}
                      {resendCooldown > 0 ? (
                        <span className="text-zinc-400 font-semibold">Reenviar en {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSubmitting}
                          className="text-[#4338ca] font-bold hover:underline"
                        >
                          Reenviar código
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: COMPLETE PROFILE */}
            {currentStep === 'PROFILE' && (
              <motion.div
                key="step-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[420px] mx-auto md:mx-0"
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Correo verificado</span>
                  </div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                    Personaliza tu cuenta
                  </h2>
                  <p className="text-zinc-500 font-medium text-sm mt-1.5">
                    Completa tus datos para preparar tus tableros de Lumins.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                  {/* Name Fields */}
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-bold text-zinc-700 ml-1">Nombre</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Leonardo"
                        autoComplete="given-name"
                        autoFocus
                        required
                        className="w-full h-11 bg-[#F4F6F9] border border-transparent rounded-xl px-3.5 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-xs font-bold text-zinc-700 ml-1">Apellido</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Morales"
                        autoComplete="family-name"
                        className="w-full h-11 bg-[#F4F6F9] border border-transparent rounded-xl px-3.5 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all"
                      />
                    </div>
                  </div>

                  {/* Country & Phone Input */}
                  <CountryPhoneInput
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                  />

                  {/* Optional Password Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-zinc-700">Contraseña de acceso</label>
                      <span className="text-[11px] text-zinc-400 font-medium">(mínimo 8 caracteres)</span>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full h-11 bg-[#F4F6F9] border border-transparent rounded-xl pl-10 pr-10 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="mt-2 h-12 bg-[#4338ca] text-white text-sm font-bold rounded-xl hover:bg-[#3730a3] transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Creando tu espacio...' : 'Comenzar a usar Lumins'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: EXISTING USER PASSWORD LOGIN */}
            {currentStep === 'EXISTING_PASSWORD' && (
              <motion.div
                key="step-existing-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[420px] mx-auto md:mx-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('EMAIL');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar correo</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                    {existingUserName ? `Hola, ${existingUserName.split(' ')[0]}` : 'Bienvenido de nuevo'}
                  </h2>
                  <p className="text-zinc-500 font-medium text-sm mt-1.5">
                    Introduce la contraseña para <span className="font-bold text-zinc-800">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleExistingUserLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold text-zinc-700">Contraseña</label>
                      <Link to="/forgot-password" className="text-xs text-[#4338ca] font-bold hover:underline">
                        ¿La olvidaste?
                      </Link>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={existingUserPassword}
                        onChange={(e) => setExistingUserPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        autoFocus
                        required
                        className="w-full h-12 bg-[#F4F6F9] border border-transparent rounded-xl pl-10 pr-10 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="mt-2 h-12 bg-[#4338ca] text-white text-sm font-bold rounded-xl hover:bg-[#3730a3] transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
                  >
                    {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
