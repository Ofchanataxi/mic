/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
      },
      boxShadow: {
        soft: '0 12px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
