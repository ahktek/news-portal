import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          primary: "#e11d48", // SmartMag vibrant editorial red
          hover: "#be123c",
        },
        smartmag: {
          dark: "#0f172a",
          darker: "#090d16",
          cardDark: "#1e293b",
          borderDark: "#334155",
          badgeRed: "#dc2626",
          badgeBlue: "#2563eb",
          badgeGreen: "#059669",
          badgePurple: "#7c3aed",
          badgeOrange: "#ea580c",
          badgePink: "#db2777",
          badgeCyan: "#0891b2",
        },
      },
      fontFamily: {
        serif: ["Merriweather", "Noto Serif Bengali", "serif"],
        sans: ["Inter", "Noto Sans Bengali", "sans-serif"],
      },
      boxShadow: {
        smartmag: "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
        "smartmag-hover": "0 20px 35px -10px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
