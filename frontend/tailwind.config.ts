import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#031A33", 800: "#06284D" },
        teal: { 500: "#0E9AA0", 600: "#0B8186" },
        "link-blue": "#0A5FD1",
        "text-dark": "#0F1B2D",
        muted: "#6B7A90",
        border: "#D9E0EA",
        "bg-soft": "#F6F8FB",
      },
      boxShadow: {
        card: "0 18px 60px rgba(15, 27, 45, 0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
