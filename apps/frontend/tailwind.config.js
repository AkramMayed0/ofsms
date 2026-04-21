/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Arabic-first font stack
        sans: ['Cairo', 'Tajawal', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1B5E8C',
          light: '#2E7EB8',
          dark: '#134569',
        },
        accent: '#F0A500',
        danger: '#C0392B',
        success: '#27AE60',
      },
    },
  },
  plugins: [],
};
