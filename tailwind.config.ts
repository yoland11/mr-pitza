import type { Config } from 'tailwindcss';

/**
 * نظام التصميم لمستر بيتزا — Mr Pizza Design System
 * ⚠️ لا تغيّر هذه القيم بعد الإطلاق. أي إضافة جديدة يجب أن تستخدم نفس الـ tokens.
 * Do NOT change these tokens after launch. New features must reuse the same scale.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // الهوية: أحمر، أصفر، أسود، أبيض
        brand: {
          red: '#E11221',
          'red-dark': '#B00D19',
          'red-light': '#FF3344',
          yellow: '#FFC11E',
          'yellow-dark': '#E0A400',
          'yellow-light': '#FFD65A',
        },
        ink: {
          DEFAULT: '#121212',
          soft: '#1E1E1E',
          muted: '#6B6B6B',
        },
        cream: '#FFFBF2',
        surface: '#FFFFFF',
        line: '#ECECEC',
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-cairo)', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 8px 30px -12px rgba(18,18,18,0.18)',
        'card-hover': '0 18px 48px -16px rgba(225,18,33,0.28)',
        glow: '0 0 0 4px rgba(255,193,30,0.18)',
      },
      maxWidth: {
        page: '1200px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.5s ease-out both',
        float: 'float 5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
