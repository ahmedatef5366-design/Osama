import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Syne", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
        arabic: ["var(--font-arabic)", "Cairo", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          low: "var(--surface-low)",
          high: "var(--surface-high)",
          edge: "var(--surface-edge)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          dim: "var(--accent-dim)",
          glow: "var(--accent-glow)",
          text: "var(--accent-text)",
          mute: "var(--accent-mute)",
        },
        text: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          "on-accent": "var(--text-on-accent)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },
        ring: "var(--ring)",
        success: {
          DEFAULT: "var(--success)",
          dim: "var(--success-dim)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          dim: "var(--warning-dim)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          dim: "var(--danger-dim)",
        },
        info: {
          DEFAULT: "var(--info)",
          dim: "var(--info-dim)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
        "6xl": "var(--text-6xl)",
        "7xl": "var(--text-7xl)",
        "8xl": "var(--text-8xl)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-soft": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        mesh: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        mesh: "mesh 12s ease infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
