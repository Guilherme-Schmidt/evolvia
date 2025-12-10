/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        card: '#1A1F29',
        primary: '#3182CE',
        success: '#38A169',
        danger: '#E53E3E',
        purple: '#9F7AEA',
      }
    },
  },
  plugins: [],
}
