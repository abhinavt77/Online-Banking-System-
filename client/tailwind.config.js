/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1e40af',
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0f172a'
        },
        emerald: {
          accent: '#10b981',
          hover: '#059669'
        }
      }
    },
  },
  plugins: [],
}
