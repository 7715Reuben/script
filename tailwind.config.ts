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
        // Base palette — light default
        bone: "#F5F0EB",
        "bone-dark": "#EDE6DC",
        ink: "#1A1714",
        "ink-secondary": "#6B6460",
        "ink-faint": "#9E9590",
        border: "#E0D9D1",

        // Event palettes
        "portrait-bg": "#FDF6E3",
        "portrait-accent": "#C9943A",
        "morning-bg": "#FDF0EE",
        "morning-accent": "#C4827A",
        "evening-bg": "#F0F2F8",
        "evening-accent": "#5C6E94",
        "weekly-bg": "#FBF5E6",
        "weekly-accent": "#B8923A",

        // Dark mode equivalents
        "dark-bg": "#1A1714",
        "dark-surface": "#231F1C",
        "dark-border": "#2E2926",
        "dark-text": "#F5F0EB",
        "dark-text-secondary": "#8A847E",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        script: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      lineHeight: {
        relaxed: "1.75",
        loose: "2",
      },
      transitionDuration: {
        "2000": "2000ms",
        "3000": "3000ms",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.7s ease-out forwards",
        "palette-shift": "paletteShift 0.8s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
