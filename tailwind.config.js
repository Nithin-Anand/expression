module.exports = {
    content: [
        "./src/**/*.{astro,html,js,jsx,ts,tsx}", // Ensure your files are included
    ],
    theme: {
        extend: {},
    },
    plugins: [require("@tailwindcss/typography")], // Correct plugin syntax
};