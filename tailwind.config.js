/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './App.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D94E28', // Roasted Terracotta (Primary Brand)
          dark: '#B83D1B',
          light: '#FDECE7',
        },
        sattu: {
          DEFAULT: '#F59E0B', // Sattu Gold (Secondary Accent)
          light: '#FEF3C7',
        },
        chutney: {
          DEFAULT: '#16A34A', // Chutney Green (Veg / Open / Free Delivery)
          light: '#DCFCE7',
        },
        spiced: {
          DEFAULT: '#DC2626', // Spiced Crimson (Non-Veg / Closed / Alert)
          light: '#FEE2E2',
        },
        alabaster: '#FAF8F5', // Warm Alabaster App Background
      },
    },
  },
  plugins: [],
};
