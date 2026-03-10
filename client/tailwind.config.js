/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark Theme Palette (X/Twitter inspired)
        dark: {
          900: '#000000', // Pure black
          800: '#16181C', // Deep charcoal
          700: '#1C1F26', // Dark gray
          600: '#2F3336', // Medium gray
          500: '#3E4347', // Light gray
          400: '#71767B', // Muted gray
          300: '#8B9095', // Text gray
          200: '#A8ADB2', // Light text
        },
        // Accent colors
        accent: {
          blue: '#1D9BF0', // Twitter blue
          'blue-dark': '#1A8CD8',
          green: '#00BA7C',
          red: '#F91880',
          yellow: '#FFD400',
          purple: '#7856FF',
        },
        // Kept for compatibility
        primary: {
          50: '#E8F5FE',
          100: '#D1EBFD',
          200: '#A3D7FB',
          300: '#75C3F9',
          400: '#47AFF7',
          500: '#1D9BF0',
          600: '#1A8CD8',
          700: '#167BBF',
          800: '#126BA7',
          900: '#0E5A8E',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #000000 0%, #16181C 100%)',
        'gradient-accent': 'linear-gradient(135deg, #1D9BF0 0%, #7856FF 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(29, 155, 240, 0.1), transparent)',
      },
      boxShadow: {
        'dark-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        'glow-blue': '0 0 20px rgba(29, 155, 240, 0.3)',
        'glow-purple': '0 0 20px rgba(120, 86, 255, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
