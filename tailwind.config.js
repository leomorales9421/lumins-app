const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand
        'brand-primary': '#7A5AF8',
        'brand-secondary': '#E91E63',
        'brand-tertiary': '#FF8A80',
        'brand-neutral': '#6B7280',
        'brand-bg': '#F0F1F3',

        // ClickUp-inspired semantic palette
        'cu-bg': '#F0F1F3',
        'cu-surface': '#FFFFFF',
        'cu-border': '#E8E9EC',
        'cu-text': '#1A1A2E',
        'cu-muted': '#6B7280',
        'cu-accent': '#7A5AF8',
        'cu-accent-light': '#EDE9FE',

        // Semantic aliases
        'vibrant-purple': '#7A5AF8',
        'vibrant-pink': '#E91E63',
        'soft-purple': '#F0F1F3',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(122,90,248,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.10)',
        'heavy': '0 20px 50px rgba(122, 90, 248, 0.15)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
