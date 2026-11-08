import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyThemeToDom, resolveCurrentTheme } from './lib/theme'

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
