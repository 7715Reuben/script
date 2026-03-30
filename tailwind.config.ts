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
        // Base palette — light default (blush pink + dusty blue)
        bone: "#FEF6FA",
        "bone-dark": "#F8EAF2",
        ink: "#2E5070",
        "ink-secondary": "#5A7A98",
        "ink-faint": "#8AAABF",
        border: "#E4CED8",

        // Event palettes — light mode
        "portrait-bg": "#FFE4EF",   // warm blush rose — ceremonial, becoming
        "portrait-accent": "#B03870",
        "morning-bg": "#EDF5FF",    // soft periwinkle blue — new day opening
        "morning-accent": "#4870A0",
        "evening-bg": "#E6EDF8",    // deeper slate blue — introspective, quiet
        "evening-accent": "#385888",
        "weekly-bg": "#FFE8F2",     // vivid sakura — celebratory
        "weekly-accent": "#983868",

        // Dark mode (deep twilight)
        "dark-bg": "#0C0818",
        "dark-surface": "#181028",
        "dark-border": "#281840",
        "dark-text": "#F8E8F2",
        "dark-text-secondary": "#C0A0C0",
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
