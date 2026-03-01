/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4f1',
          100: '#b3e0d4',
          200: '#80ccb7',
          300: '#4db89a',
          400: '#1aa47d',
          500: '#0d6b54',
          600: '#0a5442',
          700: '#073d31',
          800: '#05261f',
          900: '#02130f',
        },
        gov: {
          blue: '#1e3a5f',
          gold: '#c9a227',
          white: '#ffffff',
        }
      },
    },
  },
  plugins: [],
}
