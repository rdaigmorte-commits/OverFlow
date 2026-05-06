/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        panel: '#121212',
        panel2: '#181818',
        text: '#f4f4f5',
        muted: '#a1a1aa',
        accent: '#ff7a00',
        accent2: '#ff9f1a',
        border: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,122,0,0.25), 0 0 30px rgba(255,122,0,0.10)',
      }
    },
  },
  plugins: [],
};
