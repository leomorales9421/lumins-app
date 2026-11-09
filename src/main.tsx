import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyThemeToDom, resolveCurrentTheme } from './lib/theme'

// Handle Vite dynamic import chunk errors after new deployments (prevent blank screen on 404 chunks)
if (typeof window !== 'undefined') {
  const handleChunkReload = () => {
    const lastReload = sessionStorage.getItem('lumins_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('lumins_chunk_reload', String(now));
      window.location.reload();
    }
  };

  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Lumins] Nueva versión detectada (chunk desactualizado), recargando aplicación...', event);
    handleChunkReload();
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError')
    ) {
      console.warn('[Lumins] Módulo desactualizado tras despliegue, recargando...', msg);
      handleChunkReload();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = (typeof reason === 'string' ? reason : reason?.message) || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError')
    ) {
      console.warn('[Lumins] Módulo dinámico desactualizado tras despliegue, recargando...', msg);
      handleChunkReload();
    }
  });
}

// Initialize theme from localStorage consistently
applyThemeToDom(resolveCurrentTheme(), false);

// Listen for OS theme changes when 'system' mode is selected
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const active = resolveCurrentTheme();
    if (active === 'system') {
      applyThemeToDom('system', false);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
