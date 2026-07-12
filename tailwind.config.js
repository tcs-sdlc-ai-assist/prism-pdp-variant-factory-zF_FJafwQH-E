/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6edfa',
          100: '#b3c7f0',
          200: '#80a1e6',
          300: '#4d7bdc',
          400: '#2660d2',
          500: '#0046BE',
          600: '#003da8',
          700: '#003391',
          800: '#002a7b',
          900: '#001f5c',
        },
        accent: {
          50: '#fffee6',
          100: '#fffcb3',
          200: '#fffa80',
          300: '#fff84d',
          400: '#fff626',
          500: '#FFF200',
          600: '#e6da00',
          700: '#ccbf00',
          800: '#b3a500',
          900: '#998c00',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};