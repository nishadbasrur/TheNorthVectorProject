import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["DM Serif Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        navy: {
          950: "#04091a",
          900: "#070d24",
          800: "#0c1435",
          700: "#122050",
          600: "#1a2d6b",
          accent: "#3b5bdb",
        },
        cyan: "#4dcabc",
        gold: "#c9a84c",
      },
    },
  },
  plugins: [],
};

export default config;
