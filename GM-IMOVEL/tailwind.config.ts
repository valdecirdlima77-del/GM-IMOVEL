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
          DEFAULT: "#0F6E5B",
          dark: "#0A4F41",
        },
        secondary: "#E07A4F",
        graphite: "#1F2937",
        offwhite: "#FAF9F6",
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
