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
        // Base palette — light default (cherry blossom)
        bone: "#FAF0F4",
        "bone-dark": "#F2E2EB",
        ink: "#1C1128",
        "ink-secondary": "#6B4D62",
        "ink-faint": "#A888A0",
        border: "#E8D4DF",

        // Event palettes — light mode
        "portrait-bg": "#FDE0EE",   // deep rose-sakura — the moment of becoming
        "portrait-accent": "#B84870",
        "morning-bg": "#F5EEFB",    // pale lavender-blossom — new day opening
        "morning-accent": "#8050A8",
        "evening-bg": "#EAE6F5",    // twilight lavender — introspective, quieter
        "evening-accent": "#4A3890",
        "weekly-bg": "#FDE8F3",     // vivid sakura in full bloom — celebratory
        "weekly-accent": "#A03868",

        // Dark mode equivalents (deep twilight)
        "dark-bg": "#110C1A",
        "dark-surface": "#1C1528",
        "dark-border": "#2E2040",
        "dark-text": "#F5E0EA",
        "dark-text-secondary": "#C4A0B8",
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
