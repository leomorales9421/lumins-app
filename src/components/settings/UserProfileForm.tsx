import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Globe, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import { Skeleton } from '../ui/Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

const UserProfileForm: React.FC = () => {
  const { user, setUser, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    avatarUrl: user?.avatarUrl || '',
  });

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  // IP Detection for country/prefix
  useEffect(() => {
    if (!formData.country) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const detectedCountry = LATAM_COUNTRIES.find(c => c.code === data.country_code);
          if (detectedCountry) {
            setFormData(prev => ({ 
              ...prev, 
              country: detectedCountry.name,
              phone: prev.phone || detectedCountry.prefix 
            }));
          }
        })
        .catch(err => console.error('IP detection failed', err));
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setAvatarError('Solo se permiten imágenes JPG, PNG, GIF o WebP.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('La imagen no puede superar los 2MB.');
      return;
    }

    setAvatarUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('avatar', file);

    apiClient.patch<{ data: { avatarUrl: string } }>('/api/users/avatar', uploadFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(response => {
      const newAvatarUrl = (response.data as any).user.avatarUrl;
      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      // Actualizar el contexto de auth inmediatamente para que el NavBar y otros componentes se enteren
      if (setUser && user) {
        setUser({ ...user, avatarUrl: newAvatarUrl });
      }
      setAvatarUploading(false);
    })
    .catch(err => {
      console.error('Avatar upload failed', err);
      setAvatarError('Error al subir la imagen. Intenta de nuevo.');
      setAvatarUploading(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const response = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        name: fullName,
        phone: formData.phone,
        country: formData.country,
        avatarUrl: formData.avatarUrl,
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden p-8 space-y-6">
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="flex items-center gap-6 mb-8">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-6 border-t border-zinc-100">
          <Skeleton className="h-11 w-36" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="p-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Información del Perfil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#F4F6F9] border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden">
                {avatarUploading ? (
                  <Loader2 size={28} className="animate-spin text-zinc-400" />
                ) : formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl 
                      ? (formData.avatarUrl.startsWith('http') || formData.avatarUrl.startsWith('data:') 
                        ? formData.avatarUrl 
                        : `${API_BASE_URL}${formData.avatarUrl.startsWith('/') ? '' : '/'}${formData.avatarUrl}`)
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=7A5AF8&color=fff`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Camera size={32} className="text-zinc-400" />
                )}
              </div>
              {!avatarUploading && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                  />
                  <span className="text-xs font-bold">Cambiar</span>
                </label>
              )}
            </div>
            <div>
              <p className="font-bold text-zinc-900">Tu Avatar</p>
              <p className="text-sm text-zinc-500">JPG, GIF o PNG. Máximo 2MB.</p>
              {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Nombre</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                placeholder="Ej. Juan"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Apellido</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                placeholder="Ej. Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full p-3 rounded-lg border border-zinc-200 bg-slate-50 text-zinc-500 cursor-not-allowed outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">País / Región</label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="">Seleccionar país...</option>
                  {LATAM_COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Teléfono</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                placeholder="+54 9 11 ..."
              />
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
              <CheckCircle2 size={16} />
              ¡Perfil actualizado correctamente!
            </div>
          )}

          <div className="pt-6 border-t border-zinc-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || avatarUploading}
              className="bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileForm;
