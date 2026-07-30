/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eef5fc',
          200: '#c6d8ec',
          300: '#a7c0df',
          600: '#245b9e',
          700: '#174a8b',
          800: '#123b70',
          900: '#0e2d57',
          950: '#081f3d',
        },
      },
    },
  },
  plugins: [],
}
