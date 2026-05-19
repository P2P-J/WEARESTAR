import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#06082a",
          900: "#0a0d3a",
          800: "#11154a",
          700: "#1a1f5d",
          600: "#252a78",
        },
        star: {
          DEFAULT: "#FFE08A",
          soft: "#FFD580",
          mine: "#FFB3CE",
          dim: "#9b95c4",
          ghost: "rgba(255,255,255,0.18)",
        },
        ink: {
          DEFAULT: "#f7f1d9",
          muted: "#c2bdd8",
          faint: "#8480a8",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      letterSpacing: {
        wider2: "0.18em",
        wider3: "0.25em",
      },
      keyframes: {
        twinkle: {
          "0%,100%": { opacity: "0.5" },
          "50%":     { opacity: "1" },
        },
        rise: {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.85)" },
          "60%":  { opacity: "0.85", transform: "translateY(-2px) scale(1.05)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        rise: "rise 900ms cubic-bezier(0.2,0.7,0.2,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
