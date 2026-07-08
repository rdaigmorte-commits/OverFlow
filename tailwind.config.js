/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      '#E9E5DD',
        panel:   '#FDFBF6',
        panel2:  '#FFFFFF',
        text:    '#1B1B23',
        muted:   '#8A8578',
        accent:  '#7C5CFF',
        accent2: '#FFC83D',
        accent3: '#46C93A',
        border:  '#E5DECB',
        error:   '#f87171',
        accentSoft:        '#EDE9FF',
        accentSoftBorder:  '#D9CCFF',
        accent2Soft:       '#FFF6DE',
        accent2SoftBorder: '#FBE9B8',
        accent3Soft:       '#E7F8E4',
        accent3SoftBorder: '#C9F0C1',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,0.25), 0 0 30px rgba(124,92,255,0.10)',
      },
    },
  },
  plugins: [],
};
