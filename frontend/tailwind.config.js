/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed', 100: '#ffedd5', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
        },
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 500: '#4f46e5', 600: '#4338ca', 700: '#3730a3',
        },
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeInUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeInDown: { '0%': { opacity: 0, transform: 'translateY(-12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(0.94)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        slideInLeft: { '0%': { opacity: 0, transform: 'translateX(-16px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: 0, transform: 'translateX(16px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        blobMove: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(24px,-18px) scale(1.08)' },
          '66%': { transform: 'translate(-18px,14px) scale(0.95)' },
        },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeOut: { '0%': { opacity: 1 }, '100%': { opacity: 0 } },
        scaleOut: { '0%': { opacity: 1, transform: 'scale(1)' }, '100%': { opacity: 0, transform: 'scale(0.94)' } },
        toastIn: { '0%': { opacity: 0, transform: 'translateX(110%)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        toastOut: { '0%': { opacity: 1, transform: 'translateX(0)' }, '100%': { opacity: 0, transform: 'translateX(110%)' } },
        pop: { '0%': { transform: 'scale(0)' }, '60%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
        shrink: { '0%': { transform: 'scaleX(1)' }, '100%': { transform: 'scaleX(0)' } },
        bubble: {
          '0%': { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
          '10%': { opacity: 1 },
          '50%': { transform: 'translate(var(--sway, 30px), -55vh) scale(1)' },
          '90%': { opacity: 0.9 },
          '100%': { transform: 'translate(0, -115vh) scale(1.1)', opacity: 0 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tilt, 0deg))' },
          '50%': { transform: 'translateY(-14px) rotate(var(--tilt, 0deg))' },
        },
        confetti: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: 0 },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0) scale(1.1)' },
          '25%': { transform: 'rotate(-10deg) scale(1.15)' },
          '75%': { transform: 'rotate(10deg) scale(1.15)' },
        },
        // Admin tables: rows rise in with a slight scale
        rowIn: { '0%': { opacity: 0, transform: 'translateY(10px) scale(0.985)' }, '100%': { opacity: 1, transform: 'translateY(0) scale(1)' } },
        // Admin sidebar: light sweep across the active item + soft pulsing glow
        sheen: { '0%': { transform: 'translateX(-150%) skewX(-12deg)' }, '55%, 100%': { transform: 'translateX(350%) skewX(-12deg)' } },
        glow: {
          '0%, 100%': { boxShadow: '0 4px 14px -4px rgba(14,165,233,0.55)' },
          '50%': { boxShadow: '0 6px 24px 0 rgba(125,211,252,0.85)' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0)' },
          '20%, 60%': { transform: 'rotate(-10deg)' },
          '40%, 80%': { transform: 'rotate(10deg)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn .5s ease-out both',
        fadeInUp: 'fadeInUp .5s ease-out both',
        fadeInDown: 'fadeInDown .4s ease-out both',
        scaleIn: 'scaleIn .35s cubic-bezier(0.34,1.56,0.64,1) both',
        slideInLeft: 'slideInLeft .35s ease-out both',
        slideInRight: 'slideInRight .3s ease-out both',
        blob: 'blobMove 9s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        fadeOut: 'fadeOut .2s ease-in both',
        scaleOut: 'scaleOut .2s ease-in both',
        toastIn: 'toastIn .4s cubic-bezier(0.21,1.02,0.73,1) both',
        toastOut: 'toastOut .3s ease-in both',
        pop: 'pop .45s cubic-bezier(0.34,1.56,0.64,1) both',
        shrink: 'shrink linear both',
        shake: 'shake .6s ease-in-out .2s both',
        bubble: 'bubble linear infinite',
        gradient: 'gradientShift 8s ease infinite',
        float: 'float 5s ease-in-out infinite',
        confetti: 'confetti linear forwards',
        wiggle: 'wiggle .5s ease-in-out',
        sheen: 'sheen 3.5s ease-in-out infinite',
        rowIn: 'rowIn .45s cubic-bezier(0.22,1,0.36,1) both',
        glow: 'glow 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
