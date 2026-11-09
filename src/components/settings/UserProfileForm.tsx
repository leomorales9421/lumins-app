import React, { useState, useEffect, useMemo } from 'react';
import { Camera, Save, Loader2, Globe, CheckCircle2, Mail, Phone, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import { Skeleton } from '../ui/Skeleton';
import { compressImage } from '../../lib/image-utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface CountryOption {
  name: string;
  code: string;
  prefix: string;
  defaultTimezone: string;
}

export const LATAM_COUNTRIES: CountryOption[] = [
  { name: 'Argentina', code: 'AR', prefix: '+54', defaultTimezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Bolivia', code: 'BO', prefix: '+591', defaultTimezone: 'America/La_Paz' },
  { name: 'Brasil', code: 'BR', prefix: '+55', defaultTimezone: 'America/Sao_Paulo' },
  { name: 'Chile', code: 'CL', prefix: '+56', defaultTimezone: 'America/Santiago' },
  { name: 'Colombia', code: 'CO', prefix: '+57', defaultTimezone: 'America/Bogota' },
  { name: 'Costa Rica', code: 'CR', prefix: '+506', defaultTimezone: 'America/Costa_Rica' },
  { name: 'Cuba', code: 'CU', prefix: '+53', defaultTimezone: 'America/Havana' },
  { name: 'Ecuador', code: 'EC', prefix: '+593', defaultTimezone: 'America/Guayaquil' },
  { name: 'El Salvador', code: 'SV', prefix: '+503', defaultTimezone: 'America/El_Salvador' },
  { name: 'España', code: 'ES', prefix: '+34', defaultTimezone: 'Europe/Madrid' },
  { name: 'Estados Unidos', code: 'US', prefix: '+1', defaultTimezone: 'America/New_York' },
  { name: 'Guatemala', code: 'GT', prefix: '+502', defaultTimezone: 'America/Guatemala' },
  { name: 'Honduras', code: 'HN', prefix: '+504', defaultTimezone: 'America/Tegucigalpa' },
  { name: 'México', code: 'MX', prefix: '+52', defaultTimezone: 'America/Mexico_City' },
  { name: 'Nicaragua', code: 'NI', prefix: '+505', defaultTimezone: 'America/Managua' },
  { name: 'Panamá', code: 'PA', prefix: '+507', defaultTimezone: 'America/Panama' },
  { name: 'Paraguay', code: 'PY', prefix: '+595', defaultTimezone: 'America/Asuncion' },
  { name: 'Perú', code: 'PE', prefix: '+51', defaultTimezone: 'America/Lima' },
  { name: 'Puerto Rico', code: 'PR', prefix: '+1', defaultTimezone: 'America/Puerto_Rico' },
  { name: 'República Dominicana', code: 'DO', prefix: '+1', defaultTimezone: 'America/Santo_Domingo' },
  { name: 'Uruguay', code: 'UY', prefix: '+598', defaultTimezone: 'America/Montevideo' },
  { name: 'Venezuela', code: 'VE', prefix: '+58', defaultTimezone: 'America/Caracas' },
];

export const AVAILABLE_TIMEZONES = [
  { value: 'America/Caracas', label: 'Venezuela (Caracas, GMT-4)' },
  { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado, GMT+0)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá, GMT-5)' },
  { value: 'America/Lima', label: 'Perú (Lima, GMT-5)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires, GMT-3)' },
  { value: 'America/Santiago', label: 'Chile (Santiago, GMT-4 / GMT-3)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México, GMT-6)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (São Paulo, GMT-3)' },
  { value: 'America/La_Paz', label: 'Bolivia (La Paz, GMT-4)' },
  { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil / Quito, GMT-5)' },
  { value: 'America/Asuncion', label: 'Paraguay (Asunción, GMT-4)' },
  { value: 'America/Montevideo', label: 'Uruguay (Montevideo, GMT-3)' },
  { value: 'America/Panama', label: 'Panamá (GMT-5)' },
  { value: 'America/Costa_Rica', label: 'Costa Rica (San José, GMT-6)' },
  { value: 'America/Guatemala', label: 'Guatemala (GMT-6)' },
  { value: 'America/El_Salvador', label: 'El Salvador (GMT-6)' },
  { value: 'America/Tegucigalpa', label: 'Honduras (Tegucigalpa, GMT-6)' },
  { value: 'America/Managua', label: 'Nicaragua (Managua, GMT-6)' },
  { value: 'America/Havana', label: 'Cuba (La Habana, GMT-5)' },
  { value: 'America/Santo_Domingo', label: 'Rep. Dominicana (Santo Domingo, GMT-4)' },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico (San Juan, GMT-4)' },
  { value: 'America/New_York', label: 'EE.UU. Este (Nueva York / Miami, GMT-5)' },
  { value: 'America/Chicago', label: 'EE.UU. Centro (Chicago / Texas, GMT-6)' },
  { value: 'America/Denver', label: 'EE.UU. Montaña (Denver, GMT-7)' },
  { value: 'America/Los_Angeles', label: 'EE.UU. Pacífico (Los Ángeles, GMT-8)' },
  { value: 'Europe/Madrid', label: 'España (Madrid / Barcelona, GMT+1 / GMT+2)' },
  { value: 'Europe/London', label: 'Reino Unido (Londres, GMT+0 / GMT+1)' },
];

const resolveDefaultTimezone = (countryName?: string, currentTz?: string): string => {
  if (currentTz) return currentTz;
  if (countryName) {
    const matched = LATAM_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    if (matched) return matched.defaultTimezone;
  }
  try {
    const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (sysTz) return sysTz;
  } catch {}
  return 'America/Caracas';
};

const getCachedGeo = (): { country: string; prefix: string; timezone?: string } | null => {
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
    const initialTimezone =
      user?.timezone ||
      user?.preferences?.timezone ||
      cachedGeo?.timezone ||
      resolveDefaultTimezone(initialCountry);

    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: initialPhone,
      country: initialCountry,
      timezone: initialTimezone,
      avatarUrl: user?.avatarUrl || '',
    };
  });

  const allTimezones = useMemo(() => {
    if (formData.timezone && !AVAILABLE_TIMEZONES.some(t => t.value === formData.timezone)) {
      return [{ value: formData.timezone, label: `${formData.timezone} (Detectada)` }, ...AVAILABLE_TIMEZONES];
    }
    return AVAILABLE_TIMEZONES;
  }, [formData.timezone]);

  // Solo sincronizar si cambia el id de usuario (evitar re-renders y parpadeos innecesarios)
  const lastUserIdRef = React.useRef(user?.id);
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id;
      const nameParts = (user.name || '').trim().split(' ');
      const userCountry = user.country || '';
      const userTimezone =
        user.timezone ||
        user.preferences?.timezone ||
        resolveDefaultTimezone(userCountry);

      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || prev.phone,
        country: user.country || prev.country,
        timezone: userTimezone || prev.timezone,
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
                JSON.stringify({
                  country: detectedCountry.name,
                  prefix: detectedCountry.prefix,
                  timezone: detectedCountry.defaultTimezone,
                })
              );
            } catch {}
            setFormData(prev => ({
              ...prev,
              country: prev.country || detectedCountry.name,
              phone: prev.phone || detectedCountry.prefix,
              timezone: prev.timezone || detectedCountry.defaultTimezone,
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const country = LATAM_COUNTRIES.find(c => c.name === value);
      setFormData(prev => ({
        ...prev,
        country: value,
        phone: country && (!prev.phone || prev.phone.startsWith('+')) ? country.prefix : prev.phone,
        timezone: country ? country.defaultTimezone : prev.timezone,
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
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
        timezone: formData.timezone,
        preferences: {
          ...(user?.preferences || {}),
          timezone: formData.timezone,
        },
        ...(currentAvatar ? { avatarUrl: currentAvatar } : {}),
      });

      try {
        localStorage.setItem('lumins_user_timezone', formData.timezone);
      } catch {}

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

        {/* Country / Timezone / Phone / Email Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
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
            <label className={labelClasses}>Zona Horaria</label>
            <div className="relative">
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className={`${inputWithIconClasses} appearance-none cursor-pointer pr-10`}
              >
                {allTimezones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <Clock
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

          <div>
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
