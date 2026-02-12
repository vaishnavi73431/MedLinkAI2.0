/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['var(--font-display)', 'monospace'],
                body: ['var(--font-body)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
