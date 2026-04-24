import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UserAvatarProps {
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
  name?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

/**
 * UserAvatar Component
 * 
 * Lógica de visualización:
 * 1. Si existe avatarUrl (desde prop o desde el objeto user), renderizar la imagen.
 *    - Si la URL es relativa (empieza con /), se le añade el API_BASE_URL.
 * 2. Fallback: Si no hay imagen o falla la carga, renderizar las iniciales del nombre.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user: propUser, 
  name: propName, 
  avatarUrl: propAvatarUrl, 
  size = 'md', 
  className = '' 
}) => {
  const { user: authUser } = useAuth();
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '?';
    return nameStr
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = propUser?.name || propName || authUser?.name || 'Usuario';
  // Prioridad: 
  // 1. avatarUrl pasado por props
  // 2. avatarUrl del usuario pasado por props
  // 3. avatarUrl del usuario autenticado (solo si no se pasó lo anterior)
  let displayAvatarUrl = propAvatarUrl || propUser?.avatarUrl || authUser?.avatarUrl;
  const initials = getInitials(displayName);

  // Formatear la URL si es relativa
  if (displayAvatarUrl && !displayAvatarUrl.startsWith('http') && !displayAvatarUrl.startsWith('data:')) {
    // Si no empieza por / , se lo ponemos
    const path = displayAvatarUrl.startsWith('/') ? displayAvatarUrl : `/uploads/avatars/${displayAvatarUrl}`;
    displayAvatarUrl = `${API_BASE_URL}${path}`;
  }


  const containerClasses = `relative flex items-center justify-center rounded border border-zinc-100 shadow-sm flex-shrink-0 overflow-hidden bg-zinc-50 ${sizeClasses[size]} ${className}`;

  if (displayAvatarUrl && !imageError) {
    return (
      <div className={containerClasses}>
        <img
          src={displayAvatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Generate a consistent color based on the name
  const colors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-indigo-500 to-indigo-600',
    'from-rose-500 to-rose-600',
    'from-amber-500 to-amber-600',
    'from-emerald-500 to-emerald-600',
  ];
  
  const colorIndex = displayName ? displayName.length % colors.length : 0;
  const selectedColor = colors[colorIndex];

  return (
    <div className={`${containerClasses} bg-gradient-to-br ${selectedColor} text-white font-medium`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
