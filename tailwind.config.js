/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — change here to re-skin the whole platform.
        ink: {
          950: "#05070f",
          900: "#080b18",
          850: "#0b0f22",
          800: "#0f1428",
          700: "#161c38",
          600: "#1f2748",
        },
        brand: {
          400: "#5b8cff",
          500: "#3b6fff",
          600: "#2952e6",
        },
        electric: "#4d8bff",
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(59,111,255,0.18) 0%, rgba(5,7,15,0) 70%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(59,111,255,0.45)",
        card: "0 12px 40px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeup: "fadeup 0.6s ease-out both",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
