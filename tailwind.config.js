/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      '#0d0f14',
        panel:   '#161a23',
        panel2:  '#1e2330',
        text:    '#f0f2f7',
        muted:   '#7a8299',
        accent:  '#7c6ef9',
        accent2: '#f97066',
        accent3: '#34d399',
        border:  'rgba(255,255,255,0.08)',
        error:   '#f87171',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,110,249,0.25), 0 0 30px rgba(124,110,249,0.10)',
      },
    },
  },
  plugins: [],
};
