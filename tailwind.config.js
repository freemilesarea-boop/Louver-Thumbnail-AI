/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        louver: {
          white: '#FFFFFF',
          bg: '#FAFBFC',
          warmgray: '#F4F4F5',
          border: '#E4E4E7',
          accent: '#6366F1',
          blue: '#3B82F6',
          violet: '#8B5CF6',
          mint: '#10B981',
          silver: '#94A3B8',
          text: {
            primary: '#18181B',
            secondary: '#52525B',
            muted: '#A1A1AA',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        soft: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
