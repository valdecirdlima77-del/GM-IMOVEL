import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#B8860B",
          dark: "#8B6508",
          light: "#D4A829",
          100: "#F5E6B8",
        },
        secondary: "#1F2937",
        graphite: "#1F2937",
        offwhite: "#FFFDF5",
        gold: {
          DEFAULT: "#B8860B",
          light: "#D4A829",
          dark: "#8B6508",
          50: "#FFF8E1",
          100: "#F5E6B8",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
