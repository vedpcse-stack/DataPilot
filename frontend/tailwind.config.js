/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: 'rgb(var(--dp-bg) / <alpha-value>)',
        card: 'rgb(var(--dp-card) / <alpha-value>)',
        cardAlt: 'rgb(var(--dp-card-alt) / <alpha-value>)',
        border: 'rgb(var(--dp-border) / <alpha-value>)',
        ink: 'rgb(var(--dp-ink) / <alpha-value>)',
        inkMuted: 'rgb(var(--dp-ink-muted) / <alpha-value>)',
        charcoal: 'rgb(var(--dp-charcoal) / <alpha-value>)',
        accentBg: 'rgb(var(--dp-accent-bg) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.10)',
        softLg: '0 4px 10px rgb(0 0 0 / 0.06), 0 24px 48px -20px rgb(0 0 0 / 0.18)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        pulseSoft: 'pulseSoft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
