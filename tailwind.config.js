const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core brand
        'brand-primary': '#4338ca',
        'brand-secondary': '#E91E63',
        'brand-tertiary': '#FF8A80',
        'brand-neutral': '#6B7280',
        'brand-bg': '#F0F1F3',

        // Dark mode colors
        'dark-bg': '#13151A',
        'dark-surface': '#1C1F26',
        'dark-border': 'rgba(255, 255, 255, 0.1)',

        // ClickUp-inspired semantic palette
        'cu-bg': '#F0F1F3',
        'cu-surface': '#FFFFFF',
        'cu-border': '#E8E9EC',
        'cu-text': '#1E293B',
        'cu-muted': '#6B7280',
        'cu-accent': '#4338ca',
        'cu-accent-light': '#EEF2FF',

        // Semantic aliases
        'vibrant-purple': '#4338ca',
        'vibrant-pink': '#E91E63',
        'soft-purple': '#F0F1F3',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', ...defaultTheme.fontFamily.sans],
        brand: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '4px',
        'xl': '4px',
        '2xl': '4px',
        '3xl': '4px',
        'full': '4px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.05)',
        'card': '0 1px 2px rgba(0,0,0,0.05)',
        'card-hover': '0 2px 8px rgba(67, 56, 202, 0.08)',
        'modal': '0 10px 30px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)',
        'heavy': '0 10px 25px rgba(67, 56, 202, 0.1)',
        'dropdown': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
