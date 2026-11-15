import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Home, ArrowLeft } from 'lucide-react';
import {
  LuminsServerErrorIcon,
  LuminsNotFoundIcon,
  LuminsNetworkErrorIcon,
  LuminsLockIcon,
} from './LuminsIconsBridge';

export type ErrorCode = '404' | '500' | '403' | 'network';

interface ErrorViewProps {
  code?: ErrorCode;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

const DEFAULTS: Record<
  ErrorCode,
  { badge: string; title: string; description: string }
> = {
  '404': {
    badge: '404',
    title: 'No encontramos esta página',
    description:
      'El enlace puede estar roto o el recurso fue movido o eliminado.',
  },
  '500': {
    badge: '500',
    title: 'Algo salió mal en el sistema',
    description:
      'Ocurrió un error inesperado al procesar la solicitud. Puedes reintentar en unos segundos.',
  },
  '403': {
    badge: '403',
    title: 'Acceso restringido',
    description:
      'No cuentas con los permisos necesarios para ver este contenido.',
  },
  network: {
    badge: 'Sin conexión',
    title: 'No pudimos conectar con el servidor',
    description:
      'Verifica tu conexión a internet o intenta recargar la vista nuevamente.',
  },
};

export const ErrorView: React.FC<ErrorViewProps> = ({
  code = '500',
  title,
  description,
  onRetry,
  showHomeButton = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const preset = DEFAULTS[code];

  const renderIcon = () => {
    if (code === '404') return <LuminsNotFoundIcon size={40} className="text-slate-700 dark:text-zinc-200" />;
    if (code === '403') return <LuminsLockIcon size={36} active className="text-slate-700 dark:text-zinc-200" />;
    if (code === 'network') return <LuminsNetworkErrorIcon size={40} className="text-slate-700 dark:text-zinc-200" />;
    return <LuminsServerErrorIcon size={40} className="text-slate-700 dark:text-zinc-200" />;
  };

  return (
    <div
      className={`min-h-[65vh] w-full flex items-center justify-center p-6 ${className}`}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-sm p-7 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-center justify-center mb-4">
          {renderIcon()}
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0E8786] dark:text-[#12A9A8] mb-1">
          Error {preset.badge}
        </span>

        <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
          {title || preset.title}
        </h1>

        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-sm">
          {description || preset.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-9 px-3.5 rounded-lg bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <RotateCcw size={14} />
              <span>Reintentar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Volver</span>
          </button>

          {showHomeButton && (
            <button
              type="button"
              onClick={() => navigate('/app')}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                onRetry
                  ? 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  : 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-95'
              }`}
            >
              <Home size={14} />
              <span>Ir al inicio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorView;
