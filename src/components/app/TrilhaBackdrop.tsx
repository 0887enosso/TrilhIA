/**
 * Camada decorativa fixa, atrás de todo o conteúdo (ver z-index em
 * globals.css/layout) — existia muito espaço vazio de parchment sem nada
 * desenhado nele. Uma rosa dos ventos grande e bem apagada no canto,
 * reaproveitando o mesmo motivo de bússola do emblema do chapéu do mascote
 * (consistência visual), mais um traço de trilha pontilhado subindo pela
 * lateral — tudo em opacidade baixa o bastante pra nunca competir com o
 * conteúdo real, só preencher o fundo.
 */
export function TrilhaBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden"
    >
      <svg
        viewBox="0 0 200 200"
        className="absolute -bottom-16 -right-16 h-[420px] w-[420px] text-trail opacity-[0.05]"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="100" cy="100" r="92" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="68" strokeWidth="1" />
        <path d="M100 8v20M100 172v20M8 100h20M172 100h20" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M100 30 L112 88 L170 100 L112 112 L100 170 L88 112 L30 100 L88 88 Z"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="100" r="6" strokeWidth="1.5" />
      </svg>

      <svg
        viewBox="0 0 40 800"
        preserveAspectRatio="none"
        className="absolute -left-2 top-0 h-full w-10 text-trail opacity-[0.06]"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M20 0 C 30 100, 8 180, 20 280 S 30 460, 18 560 S 26 700, 20 800"
          strokeWidth="2"
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
