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
        // Identity Graph Colors
        'brand-primary': '#7A5AF8',
        'brand-secondary': '#E91E63',
        'brand-tertiary': '#FF8A80',
        'brand-neutral': '#806F9B',
        'brand-bg': '#F3E8FF', // Soft lilac background from identity
        
        // Semantic aliases
        'vibrant-purple': '#7A5AF8',
        'vibrant-pink': '#E91E63',
        'soft-purple': '#F3E8FF',
      },
      fontFamily: {
        // Manrope is the official font from Identity Graph
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        'md': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(122, 90, 248, 0.08)',
        'heavy': '0 20px 50px rgba(122, 90, 248, 0.15)',
      }
    },
  },
  plugins: [],
}
