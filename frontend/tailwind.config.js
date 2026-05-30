/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Core brand palette
        pitch: {
          950: "#020408",
          900: "#060d14",
          800: "#0d1a24",
          700: "#142233",
          600: "#1c2e42",
          500: "#243a52",
        },
        volt: {
          400: "#c8f135",
          500: "#b5e020",
          600: "#9dc91a",
        },
        ember: {
          400: "#ff6b35",
          500: "#f5521a",
          600: "#e03e08",
        },
        ice: {
          400: "#7dd3fc",
          500: "#38bdf8",
          600: "#0ea5e9",
        },
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "pitch-gradient": "linear-gradient(180deg, #020408 0%, #060d14 100%)",
        "volt-glow": "radial-gradient(ellipse at center, rgba(200,241,53,0.15) 0%, transparent 70%)",
        "ember-glow": "radial-gradient(ellipse at center, rgba(255,107,53,0.15) 0%, transparent 70%)",
        "scan-line": "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan": "scan 2s linear infinite",
        "flicker": "flicker 4s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.8" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.9" },
          "97%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      boxShadow: {
        "volt": "0 0 30px rgba(200, 241, 53, 0.3)",
        "ember": "0 0 30px rgba(255, 107, 53, 0.3)",
        "glow-sm": "0 0 12px rgba(200, 241, 53, 0.2)",
        "card": "0 4px 24px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
