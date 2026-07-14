/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B2635', // Royal Maroon
          hover: '#731e2b',
        },
        secondary: {
          DEFAULT: '#D4A373', // Soft Gold
          dark: '#b5804c',
        },
        accent: {
          DEFAULT: '#F6E7D8', // Cream Beige
        },
        brandBg: {
          light: '#FFFDF9',
          dark: '#0F0E0E',
        },
        brandText: {
          light: '#1A1A1A',
          dark: '#F5F5F5',
        }
      },
      fontFamily: {
        headings: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-poppins)', 'sans-serif'],
        buttons: ['var(--font-montserrat)', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 20px rgba(212, 163, 115, 0.2)',
        goldHover: '0 8px 30px rgba(212, 163, 115, 0.45)',
      }
    },
  },
  plugins: [],
};
