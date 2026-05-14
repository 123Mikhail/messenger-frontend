/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          tg: {
            primary: '#179cde',
            background: '#e4ebf5',
            chat: {
              mine: '#e3ffc880',
              other: '#ffffff80',
            },
          },
        },
      },
    },

    plugins: [],
  }