/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1B5E8C',
          light:   '#2E7EB8',
          dark:    '#134569',
        },
        accent:  '#F0A500',
        danger:  '#C0392B',
        success: '#27AE60',
        warning: '#F39C12',
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
      },
    },
  },
  plugins: [],
};
