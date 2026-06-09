/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a1a",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        text: "#e8e8f0",
        muted: "rgba(255,255,255,0.4)",
        accent: "#00f5c8",
        "accent-blue": "#0078ff",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};
