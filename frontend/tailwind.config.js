/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        background: 'var(--bg-primary)',
        backgroundSecondary: 'var(--bg-secondary)',
        backgroundTertiary: 'var(--bg-tertiary)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textTertiary: 'var(--text-tertiary)',
        borderPrimary: 'var(--border-primary)',
        borderSecondary: 'var(--border-secondary)',
      },
      boxShadow: {
        custom: 'var(--shadow)',
      }
    },
  },
  plugins: [],
}