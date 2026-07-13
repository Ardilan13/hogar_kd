/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBF8F3',
        ink: '#2B2233',
        berry: {
          DEFAULT: '#A6435A',
          light: '#C97285',
          dark: '#7E2F42'
        },
        sage: {
          DEFAULT: '#6B8F71',
          light: '#9AB89F',
          dark: '#4F6E55'
        },
        honey: {
          DEFAULT: '#C98A2E',
          light: '#E0AC5F'
        },
        blush: '#F1E4E6',
        line: '#E4DDD3'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        hand: ['Caveat', 'cursive']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        paper: '0 2px 10px -2px rgba(43, 34, 51, 0.08), 0 1px 2px rgba(43, 34, 51, 0.06)',
        lift: '0 8px 24px -6px rgba(43, 34, 51, 0.16)'
      }
    }
  },
  plugins: []
};
