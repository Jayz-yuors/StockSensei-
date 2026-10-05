module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#080b11",
          card: "#0d121c",
          elevated: "#131a27",
          border: "#1e293b",
          borderSubtle: "#172033",
          emerald: "#10b981",
          emeraldMuted: "rgba(16, 185, 129, 0.12)",
          rose: "#f43f5e",
          roseMuted: "rgba(244, 63, 94, 0.12)",
          amber: "#f59e0b",
          cyan: "#06b6d4"
        },
        terminal: {
          bg: "#080b11",
          card: "#0d121c",
          panel: "#131a27",
          border: "#1e293b",
          accent: "#10b981",
          emerald: "#10b981",
          green: "#22c55e",
          neon: "#00ff66",
          rose: "#f43f5e",
          amber: "#f59e0b"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
