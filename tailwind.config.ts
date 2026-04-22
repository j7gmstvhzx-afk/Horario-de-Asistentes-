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
      padding: "1.25rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Casino Atlántico Manatí — blue palette.
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
          DEFAULT: "#1E314A",
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
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(30, 49, 74, 0.15)",
        card: "0 4px 16px -4px rgba(30, 49, 74, 0.08)",
        glow: "0 0 30px -6px rgba(74, 123, 168, 0.35)",
        floating: "0 12px 32px -8px rgba(30, 49, 74, 0.25)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #4A7BA8 0%, #5E8FBE 40%, #7FA7CE 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, #D9E6F2 0%, #F0F5FA 100%)",
        "glass-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-soft": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
