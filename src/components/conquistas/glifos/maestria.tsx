import type { Glifo, GlifoProps } from "./tipos";
import { Brilho } from "./pecas";

const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function PrimeiraPeticao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="12" y="7" width="20" height="30" rx="2" />
      <path d="M18 34l16-16 4 4-16 16-6 2z" fill="currentColor" fillOpacity={0.2} />
      <path d="M34 18l4 4" />
    </svg>
  );
}

function IntervaloDoCafezinho(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 22h20v9a10 10 0 0 1-20 0z" />
      <path d="M30 24h3a4 4 0 0 1 0 8h-3" />
      <path d="M15 16c0-3 3-3 3-6M22 16c0-3 3-3 3-6" opacity={0.6} />
      <circle cx="25" cy="9" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function VoltouPorCima(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 38c-9-6-14-11-14-17.5C10 15 13.5 11 18 11c2.5 0 4.7 1.2 6 3.2 1.3-2 3.5-3.2 6-3.2 4.5 0 8 4 8 9.5C38 27 33 32 24 38Z" />
      <path d="M18 6l1.6 3.4L23 10l-3.4 1.6L18 15l-1.6-3.4L13 10l3.4-.6z" fill="currentColor" fillOpacity={0.3} stroke="none" />
    </svg>
  );
}

function AssociadoSenior(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 16l11-7 11 7M13 24l11-7 11 7M13 32l11-7 11 7" />
    </svg>
  );
}

function SocioDeCarreira(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="29" r="10" />
      <path d="M18 20l3-11h6l3 11" />
      <path d="M20 12l4 5 4-5" fill="currentColor" fillOpacity={0.25} />
    </svg>
  );
}

function ParecerSemRessalvas(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 6l4.5 2.6 5.2-.4 1.8 4.9 4.3 2.9-1.8 4.9 1.8 4.9-4.3 2.9-1.8 4.9-5.2-.4L24 38l-4.5-2.8-5.2.4-1.8-4.9-4.3-2.9 1.8-4.9-1.8-4.9 4.3-2.9 1.8-4.9 5.2.4z" />
      <path d="M18 21l4.5 4.5L31 16" />
    </svg>
  );
}

function SemEmbargos(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 6l13 5v9c0 9-5.5 15.5-13 19-7.5-3.5-13-10-13-19v-9z" />
      <path d="M12 24l24-6M12 18l24 12" opacity={0.75} />
    </svg>
  );
}

function FichaLimpa(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 8c-3 0-4 2-4 4s1 4 4 4v24c-3 0-4 2-4 4M33 8c3 0 4 2 4 4s-1 4-4 4v24c3 0 4 2 4 4" />
      <path d="M15 8h18M15 40h18" />
      <path d="M20 16h8M20 21h8M20 26h6" opacity={0.6} />
      <Brilho x={38} y={10} s={0.8} />
    </svg>
  );
}

function CoisaJulgada(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="10" y="32" width="28" height="7" rx="1.5" />
      <path d="M24 32V19M17 19h14M14 24l3-5 3 5M31 24l3-5 3 5" />
      <path d="M14 24h6M28 24h6" />
    </svg>
  );
}

function TribunalPleno(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 30a16 16 0 0 1 32 0" />
      <path d="M6 30h36M10 30v6M16 30v6M24 30v6M32 30v6M38 30v6M8 40h32" />
      <Brilho x={24} y={12} s={0.9} />
    </svg>
  );
}

function DoutorEmIa(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 12 6 20l18 8 18-8z" />
      <path d="M14 23v8c0 3 4.5 6 10 6s10-3 10-6v-8" />
      <path d="M42 20v9" />
      <circle cx="42" cy="31" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export const GLIFOS_MAESTRIA: Record<string, Glifo> = {
  "primeira-peticao": PrimeiraPeticao,
  "intervalo-do-cafezinho": IntervaloDoCafezinho,
  "voltou-por-cima": VoltouPorCima,
  "associado-senior": AssociadoSenior,
  "socio-de-carreira": SocioDeCarreira,
  "parecer-sem-ressalvas": ParecerSemRessalvas,
  "sem-embargos": SemEmbargos,
  "ficha-limpa": FichaLimpa,
  "coisa-julgada": CoisaJulgada,
  "tribunal-pleno": TribunalPleno,
  "doutor-em-ia": DoutorEmIa,
};
