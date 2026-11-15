import React from 'react';
import { LuminsServerErrorIcon } from './icons/LuminsIcons';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Lumins ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FAFAFA] dark:bg-[#14171C]">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-sm p-7 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-center justify-center mb-4">
              <LuminsServerErrorIcon size={40} className="text-slate-700 dark:text-zinc-200" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#E54D45] mb-1">
              Error 500
            </span>
            <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Ocurrió un error inesperado
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-sm">
              La vista encontró un problema al renderizarse. Recarga la aplicación para continuar.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-9 px-4 rounded-lg bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
              >
                Recargar aplicación
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/app';
                }}
                className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold transition-all"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
