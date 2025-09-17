/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      animation: {
        'bounce-subtle': 'bounce 1s ease-in-out 2',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      boxShadow: {
        'postit': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'postit-hover': '0 6px 12px rgba(0, 0, 0, 0.15)',
        'postit-drag': '0 8px 16px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}