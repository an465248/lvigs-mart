import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#5a8bff",
          500: "#3266ff",
          600: "#1d47f5",
          700: "#1635dc",
          800: "#172eb1",
          900: "#182c8b",
          950: "#0c184a",
        },
        accent: {
          50: "#fff4e6",
          100: "#ffe4c2",
          200: "#ffc587",
          300: "#ff9f4a",
          400: "#ff7f1f",
          500: "#f76300",
          600: "#d94c00",
          700: "#b03a02",
          800: "#8c3008",
          900: "#722a0a",
        },
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde2ea",
          300: "#bcc4d2",
          400: "#8995aa",
          500: "#5d6a82",
          600: "#3f4a61",
          700: "#2b3346",
          800: "#1c2233",
          900: "#0f1424",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,20,36,0.04), 0 2px 8px rgba(15,20,36,0.04)",
        card: "0 1px 2px rgba(15,20,36,0.05), 0 6px 18px rgba(15,20,36,0.06)",
        pop: "0 8px 28px rgba(15,20,36,0.10)",
        ring: "0 0 0 4px rgba(50,102,255,0.15)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400% 0" },
          "100%": { backgroundPosition: "400% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        "fade-in": "fade-in .25s ease-out both",
        "slide-up": "slide-up .35s ease-out both",
        "scale-in": "scale-in .2s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;