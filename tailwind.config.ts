import type { Config } from "tailwindcss";

// Sistema visual do TrilhIA — ver docs/frontend.md.
//
// DOIS VERDES, de propósito, com papéis distintos:
//   `trail` = cromo/marca (sidebar, cabeçalhos, links, motivos de fundo).
//             Oliva escuro, sóbrio — é a âncora "escritório de advocacia".
//   `jade`  = conquista (botão primário, progresso, acerto, módulo concluído).
//             Verde vivo — é a cor de recompensa do jogo.
//
// REGRA DE CONTRASTE (o motivo de cada família ter `DEFAULT` e `vivid`):
// o fundo do app é claro (pergaminho), então cor viva chapada reprova em
// contraste. Por isso:
//   `DEFAULT` = tom seguro para preenchimento com texto branco por cima,
//               para borda e para gráfico solto (>= 3:1 sobre pergaminho).
//   `vivid`   = tom saturado usado SÓ dentro de ícone com contorno escuro,
//               onde quem carrega o contraste é o contorno, não o preenchimento.
//   `strong`  = tom de texto sobre fundo claro (>= 4.5:1).
//   `soft`    = fundo suave para faixas/pílulas.
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
          // Tom rebaixado para "poços": trilhos de barra de progresso, campos
          // afundados, fundo de bloco de código — o que deve parecer cavado
          // na página em vez de apoiado sobre ela.
          deep: "#EDE4CE",
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
        jade: {
          DEFAULT: "#2A7F4F",
          vivid: "#3FA76A",
          strong: "#1C5C39",
          soft: "#DCF0E4",
        },
        amber: {
          DEFAULT: "#B4791A",
          vivid: "#F0B03C",
          strong: "#8A5B0C",
          soft: "#F7E6C4",
        },
        coral: {
          DEFAULT: "#A8442C",
          vivid: "#E2492F",
          strong: "#7E2F1C",
          soft: "#F6DFD7",
        },
      },
      fontFamily: {
        // Nunito (arredondada) é a voz da interface e do jogo: títulos,
        // botões, números, HUD. Lora (serifada) fica reservada ao contexto de
        // LEITURA — corpo da aula e enunciado de questão —, que é onde uma
        // serifada de verdade ajuda em vez de atrapalhar. Ambas carregadas
        // via next/font (self-hosted, sem CDN externo) em src/app/layout.tsx.
        sans: ["var(--font-nunito)", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-lora)", "Georgia", "serif"],
        mono: ["ui-monospace", "SF Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
      },
      boxShadow: {
        // "Borda inferior" dos elementos pressionáveis: sombra sólida, sem
        // blur, que some quando o elemento afunda no :active. É o que faz o
        // botão parecer um botão físico em vez de um retângulo colorido.
        "press-jade": "0 5px 0 #1C5C39",
        "press-trail": "0 5px 0 #1A2E20",
        "press-amber": "0 5px 0 #8A5B0C",
        "press-coral": "0 5px 0 #7E2F1C",
        "press-rule": "0 4px 0 #C9B98A",
        "press-sm": "0 3px 0 #C9B98A",
        // Elevação de verdade (com blur), para o que flutua sobre a página.
        lift: "0 6px 18px -8px rgba(36, 28, 21, 0.25)",
        "lift-lg": "0 18px 44px -16px rgba(36, 28, 21, 0.35)",
        well: "inset 0 2px 4px rgba(36, 28, 21, 0.10)",
      },
      animation: {
        // Keyframes do StarBorder (src/components/reactbits/StarBorder.tsx,
        // adaptado de React Bits) — os dois "cometas" que circulam a borda.
        "star-movement-bottom": "star-movement-bottom linear infinite alternate",
        "star-movement-top": "star-movement-top linear infinite alternate",
        // Reações do HUD e de recompensa.
        estourar: "estourar 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        tremer: "tremer 420ms ease-in-out",
        flutuar: "flutuar 3.2s ease-in-out infinite",
        "subir-sumindo": "subir-sumindo 900ms ease-out forwards",
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
        // Estouro de conquista: passa do tamanho final e volta (overshoot),
        // em vez de um scale linear que parece só "aparecer".
        estourar: {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Perda de vida: o coração treme e apaga.
        tremer: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-3px) rotate(-6deg)" },
          "40%": { transform: "translateX(3px) rotate(6deg)" },
          "60%": { transform: "translateX(-2px) rotate(-4deg)" },
          "80%": { transform: "translateX(2px) rotate(4deg)" },
        },
        flutuar: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        // "+10 XP" que sobe e some.
        "subir-sumindo": {
          "0%": { transform: "translateY(4px)", opacity: "0" },
          "25%": { transform: "translateY(-2px)", opacity: "1" },
          "100%": { transform: "translateY(-28px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
