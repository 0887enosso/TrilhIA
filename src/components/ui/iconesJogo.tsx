import { SVGProps } from "react";

/**
 * Ícones do HUD de jogo — vida, estrela diária, foguinho, congelamento e XP.
 *
 * Substituem os caracteres de texto que ocupavam esse papel até aqui (♥ ♡ ★ ☆
 * 🔥 ❄), que renderizavam diferente em cada sistema operacional, não
 * escalavam junto com o resto da interface e não podiam ser animados.
 *
 * Por que multi-tom (e não `currentColor` como os ícones de linha da sidebar,
 * em src/components/app/icones.tsx): o fundo do app é claro, então cor viva
 * chapada não alcança contraste suficiente sozinha. Cada ícone aqui é
 * construído como contorno escuro + preenchimento vivo + brilho — é o
 * CONTORNO que garante a legibilidade, o que libera o preenchimento a ser
 * saturado de verdade. Ver a nota sobre DEFAULT/vivid/strong no
 * tailwind.config.ts.
 */

// Espelha os tokens do tailwind.config.ts. Duplicado aqui porque SVG
// multi-tom precisa dos valores nos atributos `fill`/`stroke`, e uma classe
// do Tailwind só resolveria uma cor por elemento.
const COR = {
  vidaFill: "#E2492F", // coral.vivid
  vidaBorda: "#7E2F1C", // coral.strong
  vidaBrilho: "#F7A491",
  ouroFill: "#F0B03C", // amber.vivid
  ouroBorda: "#8A5B0C", // amber.strong
  ouroBrilho: "#FBDC9B",
  vazioFill: "#EDE4CE", // parchment.deep
  vazioBorda: "#C9B98A", // rule.strong
  chamaFora: "#F2542D", // --blaze-mid
  chamaDentro: "#FFC24A",
  chamaBorda: "#8A1030", // --blaze-press
  geloFill: "#C4DDEB",
  geloBorda: "#4E7A93",
} as const;

type IconeProps = SVGProps<SVGSVGElement> & { tamanho?: number };

function Svg({ tamanho = 22, children, ...props }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const CAMINHO_VIDA = "M12 20.5 4.2 12.4a5 5 0 0 1 7.1-7l.7.7.7-.7a5 5 0 0 1 7.1 7L12 20.5Z";

/** Vida cheia: vermelho vivo com contorno e um brilho no lóbulo esquerdo. */
export function IconeVida({ cheia = true, ...props }: IconeProps & { cheia?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d={CAMINHO_VIDA}
        fill={cheia ? COR.vidaFill : COR.vazioFill}
        stroke={cheia ? COR.vidaBorda : COR.vazioBorda}
        strokeWidth={1.6}
      />
      {cheia ? (
        <ellipse
          cx="8.5"
          cy="8.6"
          rx="1.8"
          ry="1.15"
          transform="rotate(-38 8.5 8.6)"
          fill={COR.vidaBrilho}
          opacity="0.9"
        />
      ) : null}
    </Svg>
  );
}

const CAMINHO_ESTRELA =
  "M12 2.9l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.2l-5.6 2.9 1.1-6.2-4.6-4.4 6.3-.9L12 2.9Z";

/** Estrela diária: ouro com contorno; apagada vira o tom de pergaminho fundo. */
export function IconeEstrela({ cheia = true, ...props }: IconeProps & { cheia?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d={CAMINHO_ESTRELA}
        fill={cheia ? COR.ouroFill : COR.vazioFill}
        stroke={cheia ? COR.ouroBorda : COR.vazioBorda}
        strokeWidth={1.6}
      />
      {cheia ? (
        <path d="M12 5.6l1.6 3.3 3.6.5-2.6 2.5" stroke={COR.ouroBrilho} strokeWidth={1.4} fill="none" />
      ) : null}
    </Svg>
  );
}

/** Foguinho do streak: chama externa laranja + núcleo amarelo. */
export function IconeChama({ apagada = false, ...props }: IconeProps & { apagada?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12.7 2.3c.3 3 2.9 4.2 4.1 6.6a6.4 6.4 0 0 1-1.1 7.5 5.8 5.8 0 0 1-3.7 1.6 6 6 0 0 1-6-6c0-2.4 1.4-3.9 2.2-5.4.4 1 .9 1.7 1.7 2.1.5-3.4 1.4-4.6 2.8-6.4Z"
        fill={apagada ? COR.vazioFill : COR.chamaFora}
        stroke={apagada ? COR.vazioBorda : COR.chamaBorda}
        strokeWidth={1.5}
      />
      {!apagada ? (
        <path
          d="M12 18.1a2.9 2.9 0 0 1-2.9-3c0-1.8 1.6-2.5 2.2-4.3.9 1.3 3.5 2.3 3.5 4.3a2.8 2.8 0 0 1-2.8 3Z"
          fill={COR.chamaDentro}
        />
      ) : null}
    </Svg>
  );
}

/** Congelamento de streak (perdão de 1 dia). */
export function IconeGelo(props: IconeProps) {
  return (
    <Svg {...props}>
      <g stroke={COR.geloBorda} strokeWidth={1.6} fill="none">
        <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
        <path d="M12 6.4 10.2 4.6M12 6.4l1.8-1.8M12 17.6l-1.8 1.8M12 17.6l1.8 1.8" />
        <path d="m7.1 9.3-2.5.3m2.5-.3-.7-2.4M16.9 14.7l2.5-.3m-2.5.3.7 2.4M16.9 9.3l2.5.3m-2.5-.3.7-2.4M7.1 14.7l-2.5.3m2.5-.3-.7 2.4" />
      </g>
      <circle cx="12" cy="12" r="2.1" fill={COR.geloFill} stroke={COR.geloBorda} strokeWidth={1.4} />
    </Svg>
  );
}

/** Raio de XP — versão preenchida do ícone de linha usado na navegação. */
export function IconeXp(props: IconeProps) {
  return (
    <Svg {...props}>
      <path
        d="M13.4 2 4.8 13.4h5.1L8.8 22l8.9-11.7h-5.2L13.4 2Z"
        fill={COR.ouroFill}
        stroke={COR.ouroBorda}
        strokeWidth={1.6}
      />
    </Svg>
  );
}

/** Selo de módulo concluído — usado no mapa da trilha. */
export function IconeCheckSelo(props: IconeProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.2" fill="#2A7F4F" stroke="#1C5C39" strokeWidth={1.6} />
      <path d="m7.8 12.3 2.9 2.9 5.5-6" stroke="#FFFCF2" strokeWidth={2.4} fill="none" />
    </Svg>
  );
}
