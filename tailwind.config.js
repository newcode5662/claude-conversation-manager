/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dc',
          300: '#d4cfc3',
          400: '#b8b0a0',
          500: '#9c9180',
          600: '#807560',
          700: '#665c4d',
          800: '#524a40',
          900: '#443e36',
          950: '#25221e',
        },
        orange: {
          500: '#d97757',
          600: '#c46a4d',
        }
      }
    },
  },
  plugins: [],
}
