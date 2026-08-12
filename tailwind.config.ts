import type { Config } from "tailwindcss";

// Paleta e tipografia definidas na proposta de frontend (Fase 3) — ver
// docs/frontend.md. "trail" é a cor estrutural (marca/navegação/progresso),
// "amber" é destaque de gamificação (XP, badges, estrelas), "coral" é uso
// semântico só (corações, streak em risco, erro) — nunca decorativo.
const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "#F6F1E4",
          surface: "#FFFCF2",
          raised: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#241C15",
          soft: "#6B5D45",
          faint: "#9A8C6E",
        },
        rule: {
          DEFAULT: "#DED0A9",
          strong: "#C9B98A",
        },
        trail: {
          DEFAULT: "#33513C",
          strong: "#24392A",
          soft: "#E3EBDC",
        },
        amber: {
          DEFAULT: "#A9700F",
          strong: "#8A5B0C",
          soft: "#F3E3C4",
        },
        coral: {
          DEFAULT: "#A8442C",
          soft: "#F1DDD3",
        },
      },
      fontFamily: {
        display: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Palatino",
          "URW Palladio L",
          "Georgia",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Cascadia Code",
          "Roboto Mono",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      // Keyframes do StarBorder (src/components/reactbits/StarBorder.tsx,
      // adaptado de React Bits) — os dois "cometas" que circulam a borda.
      animation: {
        "star-movement-bottom": "star-movement-bottom linear infinite alternate",
        "star-movement-top": "star-movement-top linear infinite alternate",
      },
      keyframes: {
        "star-movement-bottom": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(-100%, 0%)", opacity: "0" },
        },
        "star-movement-top": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(100%, 0%)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
