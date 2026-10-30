/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Holographic Voice-Field Palette
        cyan: {
          DEFAULT: "#00E5FF",
          glow: "rgba(0, 229, 255, 0.4)",
          dim: "rgba(0, 229, 255, 0.12)",
          soft: "#9DEFE2",
        },
        electric: {
          DEFAULT: "#1677FF",
          blue: "#1677FF",
          glow: "rgba(22, 119, 255, 0.4)",
          dim: "rgba(22, 119, 255, 0.12)",
          ice: "#A9E6FA",
        },
        teal: {
          DEFAULT: "#00CDBA",
          glow: "rgba(0, 205, 186, 0.35)",
          dim: "rgba(0, 205, 186, 0.12)",
        },
        navy: {
          void: "#030810",
          deep: "#06121D",
          elevated: "#091B28",
          subtle: "#0E2436",
        },
        // Semantic Theme Tokens
        page: {
          DEFAULT: "var(--bg-page)",
        },
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
          subtle: "var(--bg-surface-subtle)",
        },
        border: {
          DEFAULT: "var(--border-subtle)",
          accent: "var(--border-accent)",
          glow: "var(--border-glow)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        // Approved Palette Aliases
        aqua: {
          DEFAULT: "#00E5FF",
          soft: "#9DEFE2",
          dim: "rgba(0, 229, 255, 0.12)",
          glow: "rgba(0, 229, 255, 0.35)",
        },
        ice: {
          DEFAULT: "#A9E6FA",
          blue: "#1677FF",
          dim: "rgba(169, 230, 250, 0.12)",
          glow: "rgba(169, 230, 250, 0.3)",
        },
        mint: {
          DEFAULT: "#EAF9F7",
          pale: "#EAF9F7",
          dim: "rgba(234, 249, 247, 0.08)",
        },
      },
      boxShadow: {
        "glow-cyan": "0 0 24px -2px rgba(0, 229, 255, 0.35)",
        "glow-electric": "0 0 24px -2px rgba(22, 119, 255, 0.35)",
        "glow-teal": "0 0 20px -2px rgba(0, 205, 186, 0.3)",
        "hud-card": "0 8px 32px -4px rgba(2, 6, 14, 0.7), inset 0 1px 0 0 rgba(0, 229, 255, 0.08)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      animation: {
        "drift-slow": "field-drift 24s ease-in-out infinite alternate",
        "drift-reverse": "field-drift-reverse 28s ease-in-out infinite alternate",
        "wave-pulse": "field-wave-pulse 8s ease-in-out infinite",
        "scan-line": "hud-scan 6s linear infinite",
      },
      keyframes: {
        "field-drift": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "100%": { transform: "translate3d(-2%, -3%, 0) scale(1.04)" },
        },
        "field-drift-reverse": {
          "0%": { transform: "translate3d(0, 0, 0) scale(1.02)" },
          "100%": { transform: "translate3d(2%, 3%, 0) scale(1)" },
        },
        "field-wave-pulse": {
          "0%, 100%": { opacity: "0.45", filter: "brightness(0.95)" },
          "50%": { opacity: "0.75", filter: "brightness(1.15)" },
        },
        "hud-scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
