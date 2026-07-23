import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0D10",
        surface: "#12171D",
        "surface-elevated": "#1A2128",
        border: "#2A3139",
        accent: {
          DEFAULT: "#D4FF4D",
          dim: "rgba(212, 255, 77, 0.12)",
          muted: "rgba(212, 255, 77, 0.6)",
        },
        muted: "#6B7A6E",
        "text-secondary": "#9CA3AF",
      },
      borderRadius: {
        card: "1.25rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(212, 255, 77, 0.08)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
