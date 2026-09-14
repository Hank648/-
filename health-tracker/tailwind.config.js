/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontSize: {
        'base': '18px',
        'lg': '20px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '30px',
        '4xl': '36px',
      },
    },
  },
  plugins: [],
};
