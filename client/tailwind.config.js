/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dbu: {
                    navy: '#003366',
                    blue: '#2980b9',
                    gold: '#fdc800',
                }
            },
            fontFamily: {
                sans: ['Open Sans', 'sans-serif'],
                heading: ['Roboto', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
