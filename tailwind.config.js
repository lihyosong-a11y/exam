/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f7f8fb",
        line: "#d9dee8",
        forest: "#1f6f5b",
        coral: "#d95f59",
        gold: "#b8860b",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
