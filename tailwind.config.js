// Create file: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './src/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#5D5CDE',
        secondary: '#4BB3FD',
        success: '#28C76F',
        warning: '#FF9F43',
        danger: '#EA5455',
        dark: '#181818',
        light: '#F8F9FA'
      }
    }
  },
  plugins: [],
}