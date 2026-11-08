import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Globe, CheckCircle2, Mail, Phone, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import { Skeleton } from '../ui/Skeleton';
import { compressImage } from '../../lib/image-utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const LATAM_COUNTRIES = [
  { name: 'Argentina', code: 'AR', prefix: '+54' },
  { name: 'Bolivia', code: 'BO', prefix: '+591' },
  { name: 'Brasil', code: 'BR', prefix: '+55' },
  { name: 'Chile', code: 'CL', prefix: '+56' },
  { name: 'Colombia', code: 'CO', prefix: '+57' },
  { name: 'Costa Rica', code: 'CR', prefix: '+506' },
  { name: 'Cuba', code: 'CU', prefix: '+53' },
  { name: 'Ecuador', code: 'EC', prefix: '+593' },
  { name: 'El Salvador', code: 'SV', prefix: '+503' },
  { name: 'Guatemala', code: 'GT', prefix: '+502' },
  { name: 'Honduras', code: 'HN', prefix: '+504' },
  { name: 'México', code: 'MX', prefix: '+52' },
  { name: 'Nicaragua', code: 'NI', prefix: '+505' },
  { name: 'Panamá', code: 'PA', prefix: '+507' },
  { name: 'Paraguay', code: 'PY', prefix: '+595' },
  { name: 'Perú', code: 'PE', prefix: '+51' },
  { name: 'Puerto Rico', code: 'PR', prefix: '+1' },
  { name: 'República Dominicana', code: 'DO', prefix: '+1' },
  { name: 'Uruguay', code: 'UY', prefix: '+598' },
  { name: 'Venezuela', code: 'VE', prefix: '+58' },
];

const getCachedGeo = (): { country: string; prefix: string } | null => {
  try {
    const raw = localStorage.getItem('lumins_detected_geo');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const UserProfileForm: React.FC = () => {
  const { user, setUser, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Initial state reads directly from auth session and cached geo so values render on frame 0 with zero pop-in
  const [formData, setFormData] = useState(() => {
    const nameParts = (user?.name || '').trim().split(' ');
    const cachedGeo = getCachedGeo();
    const initialCountry = user?.country || cachedGeo?.country || '';
    const initialPhone = user?.phone || (cachedGeo?.prefix ? cachedGeo.prefix : '') || '';

    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: initialPhone,
      country: initialCountry,
      avatarUrl: user?.avatarUrl || '',
    };
  });

  // Solo sincronizar si cambia el id de usuario (evitar re-renders y parpadeos innecesarios)
  const lastUserIdRef = React.useRef(user?.id);
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id;
      const nameParts = (user.name || '').trim().split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || prev.phone,
        country: user.country || prev.country,
        avatarUrl: user.avatarUrl || '',
      }));
    }
  }, [user]);

  // IP Detection for country/prefix (cached to prevent flickering across visits)
  useEffect(() => {
    const cachedGeo = getCachedGeo();
    if (!formData.country && !cachedGeo) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const detectedCountry = LATAM_COUNTRIES.find(c => c.code === data.country_code);
          if (detectedCountry) {
            try {
              localStorage.setItem(
                'lumins_detected_geo',
                JSON.stringify({ country: detectedCountry.name, prefix: detectedCountry.prefix })
              );
            } catch {}
            setFormData(prev => ({
              ...prev,
              country: prev.country || detectedCountry.name,
              phone: prev.phone || detectedCountry.prefix,
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'country') {
      const country = LATAM_COUNTRIES.find(c => c.name === value);
      if (country && (!formData.phone || formData.phone.startsWith('+'))) {
        setFormData(prev => ({ ...prev, country: value, phone: country.prefix }));
      }
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setAvatarError('Solo se permiten imágenes JPG, PNG, GIF o WebP.');
      return;
    }

    setAvatarUploading(true);

    try {
      const compressedFile = await compressImage(file);
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', compressedFile);

      const response = await apiClient.patch<{ data: { user: any } }>(
        '/api/users/avatar',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const newAvatarUrl = response.data.user.avatarUrl;
      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      if (setUser && user) {
        setUser({ ...user, avatarUrl: newAvatarUrl });
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
      setAvatarError('Error al procesar o subir la imagen. Intenta de nuevo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const currentAvatar = formData.avatarUrl || user?.avatarUrl;
      const response = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        name: fullName,
        phone: formData.phone,
        country: formData.country,
        ...(currentAvatar ? { avatarUrl: currentAvatar } : {}),
      });
      if (setUser) {
        setUser(response.data.user);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Update profile failed', err);
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClasses =
    'w-full py-2.5 sm:py-3 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A] text-base sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent focus:bg-white dark:focus:bg-[#13151A] outline-none transition-all';
  const inputClasses = `${inputBaseClasses} px-3.5 sm:px-4`;
  const inputWithIconClasses = `${inputBaseClasses} pl-10 sm:pl-10 pr-3.5 sm:pr-4`;
  const labelClasses =
    'text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5';

  if (!user) {
    return (
      <div className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden p-5 sm:p-8 space-y-6 shadow-xs">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-white/5">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-lg mt-1" />
          </div>
        </div>

        {/* Name / Last Name Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Country / Phone / Email Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-end">
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    );
  }

  const resolvedAvatarSrc = formData.avatarUrl
    ? formData.avatarUrl.startsWith('http') || formData.avatarUrl.startsWith('data:')
      ? formData.avatarUrl
      : `${API_BASE_URL}${formData.avatarUrl.startsWith('/') ? '' : '/'}${formData.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6C5DD3&color=fff`;

  return (
    <div className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
      <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
        {/* Native App Horizontal Profile Header */}
        <div className="flex items-center gap-4 pb-4 sm:pb-6 border-b border-zinc-100 dark:border-white/5">
          <label className="relative group cursor-pointer shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-xs">
              {avatarUploading ? (
                <Loader2 size={22} className="animate-spin text-[#6C5DD3]" />
              ) : (
                <img
                  src={resolvedAvatarSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Always-visible native camera badge for touch & desktop */}
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#1C1F26] active:scale-90 transition-transform">
              <Camera size={13} />
            </span>

            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || 'Tu Perfil'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-2">
              {formData.email}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 text-[#6C5DD3] dark:text-[#A599F9] text-xs font-extrabold cursor-pointer active:scale-95 transition-all">
                <Camera size={13} />
                <span>{avatarUploading ? 'Subiendo...' : 'Cambiar foto'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                />
              </label>
              <span className="text-[10px] font-semibold text-zinc-400">
                JPG, PNG o WebP · Máx. 12MB
              </span>
            </div>
            {avatarError && <p className="text-xs text-rose-500 mt-1.5 font-semibold">{avatarError}</p>}
          </div>
        </div>

        {/* Form Fields - 2 columns for Name & Last Name even on mobile for native compactness */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <div>
            <label className={labelClasses}>Nombre</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Ej. Juan"
            />
          </div>

          <div>
            <label className={labelClasses}>Apellido</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Ej. Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={labelClasses}>País / Región</label>
            <div className="relative">
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={`${inputWithIconClasses} appearance-none cursor-pointer pr-10`}
              >
                <option value="">Seleccionar país...</option>
                {LATAM_COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Globe
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
              />
              <ChevronDown
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Teléfono</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputWithIconClasses}
                placeholder="+58 412 ..."
              />
              <Phone
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses}>Correo Electrónico (ID de cuenta)</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full py-2.5 sm:py-3 pl-10 sm:pl-10 pr-3.5 sm:pr-4 rounded-xl border border-zinc-200/60 dark:border-white/5 bg-zinc-100/80 dark:bg-white/[0.03] text-sm font-semibold text-zinc-500 dark:text-zinc-500 cursor-not-allowed outline-none"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-500/20">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>¡Perfil actualizado correctamente!</span>
          </div>
        )}

        <div className="pt-3 sm:pt-5 border-t border-zinc-100 dark:border-white/5 flex justify-end">
          <button
            type="submit"
            disabled={loading || avatarUploading}
            className="w-full sm:w-auto bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white font-extrabold py-3.5 sm:py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6C5DD3]/25 disabled:opacity-50 active:scale-[0.98] text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;
