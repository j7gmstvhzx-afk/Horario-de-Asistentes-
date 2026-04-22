import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Pastel palette for Casino Atlántico Manatí.
        // Derived from the logo's primary blue (#4A7BA8).
        brand: {
          DEFAULT: "#4A7BA8",
          50: "#F0F5FA",
          100: "#D9E6F2",
          200: "#A8C5E0",
          300: "#7FA7CE",
          400: "#5E8FBE",
          500: "#4A7BA8",
          600: "#3B6289",
          700: "#2C496A",
          800: "#1E314A",
          900: "#121E2C",
        },
        accent: {
          DEFAULT: "#F4D6D6",
          soft: "#FCEEEE",
        },
        success: {
          DEFAULT: "#C8E6C9",
          fg: "#2E7D32",
        },
        warning: {
          DEFAULT: "#FFE0B2",
          fg: "#B26A00",
        },
        danger: {
          DEFAULT: "#FFCDD2",
          fg: "#B71C1C",
        },
        surface: {
          DEFAULT: "#FAF9F6",
          raised: "#FFFFFF",
          sunken: "#F1EFEA",
        },
        ink: {
          DEFAULT: "#2C3E50",
          muted: "#5C6E80",
          faint: "#8798A8",
        },
        border: {
          DEFAULT: "#E2E6EA",
          strong: "#C8D0D7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 4px 14px -2px rgba(44, 62, 80, 0.08)",
        card: "0 2px 8px -1px rgba(44, 62, 80, 0.06)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
        "scale-in": "scale-in 180ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
