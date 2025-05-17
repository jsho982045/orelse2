// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Required for next-themes
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme Colors (Carolina Inspired)
        'carolina-blue': '#4A90E2', // Or your preferred Carolina Blue hex
        'carolina-white': '#FFFFFF',
        'carolina-grey-light': '#F7FAFC', // Very light grey for backgrounds/cards
        'carolina-grey-medium': '#A0AEC0', // For muted text
        'carolina-grey-dark': '#4A5568',   // For secondary text
        'carolina-black': '#1A202C',       // For primary text

        // Dark Theme Colors (Raycast/Detroit Red Inspired)
        'raycast-red': '#C8102E', // Detroit Red Wings Red
        'raycast-black': '#121212',       // Very dark background
        'raycast-grey-dark': '#1A1A1A',   // Slightly lighter dark for cards/surfaces
        'raycast-grey-medium': '#333333', // Borders or secondary elements
        'raycast-grey-light': '#A0AEC0',  // Muted text in dark mode
        'raycast-white': '#E2E8F0',       // Primary text in dark mode

        // Neutral/Utility Colors (can be used in both themes or for specific purposes)
        'destructive-red': '#E53E3E', // For error states or delete buttons
        'destructive-red-dark': '#FC8181', // Lighter red for dark mode destructive actions
        'success-green': '#48BB78',
        'warning-yellow': '#ECC94B',
      },
      fontFamily: {
        // These will be mapped to the CSS variables set by next/font/google in layout.tsx
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.25rem',  // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem',   // 8px (Default for many elements)
        'xl': '0.75rem',  // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
        '4xl': '2.25rem', // 36px (Your specific request for main cards)
        'button': '0.5rem', // Consistent button rounding
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      // You can add other theme extensions here (spacing, opacity, etc.)
    },
  },
  plugins: [
    // require('tailwindcss-animate'),
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
