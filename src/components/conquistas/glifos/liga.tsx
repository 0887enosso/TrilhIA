import type { Glifo, GlifoProps } from "./tipos";
import { Brilho } from "./pecas";

const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function PrimeiraSustentacao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="19" y="8" width="10" height="16" rx="5" />
      <path d="M13 22a11 11 0 0 0 22 0M24 33v7M18 40h12" />
      <path d="M32 12c2 1 3 3 3 6M16 12c-2 1-3 3-3 6" opacity={0.6} />
    </svg>
  );
}

function DecisaoUnanime(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="18" r="10" />
      <path d="M24 12l1.8 3.8 4.2.6-3 3 .7 4.1-3.7-2-3.7 2 .7-4.1-3-3 4.2-.6z" fill="currentColor" fillOpacity={0.25} />
      <path d="M18 27l-4 13 6-3 4 4 3-11M30 27l4 13-6-3-4 4" />
    </svg>
  );
}

function PodioDosAutos(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 40h36" />
      <rect x="9" y="26" width="10" height="14" />
      <rect x="19" y="18" width="10" height="22" />
      <rect x="29" y="30" width="10" height="10" />
    </svg>
  );
}

function PresencaConfirmada(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="9" width="32" height="30" rx="3" />
      <path d="M8 17h32" />
      <path d="M14 24l2 2 3-3M25 24l2 2 3-3M14 32l2 2 3-3M25 32l2 2 3-3" />
    </svg>
  );
}

function MaratonistaDaLiga(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 32V12h16v20z" />
      <path d="M12 17h8M12 22h8M12 27h6" opacity={0.6} />
      <path d="M26 34c2-4 6-5 9-4 3-1 6 1 6 4 0 2-2 3-4 3H29c-2 0-3-1-3-3Z" />
      <path d="M36 30l4-3" />
    </svg>
  );
}

function ViradaDaSemana(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 34h6M8 29h10M8 24h14M8 19h18" opacity={0.55} />
      <path d="M24 40 36 12" strokeWidth={2.5} />
      <path d="M36 12l-8 2 6 6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FotoFinish(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="7" y="16" width="30" height="20" rx="3" />
      <path d="M17 16l3-5h8l3 5" />
      <circle cx="22" cy="26" r="6" />
      <Brilho x={34} y={13} s={0.9} />
    </svg>
  );
}

function EloDaEquipe(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="12" r="5" />
      <circle cx="12" cy="30" r="5" />
      <circle cx="36" cy="30" r="5" />
      <path d="M20 16l-5 10M28 16l5 10M17 32h14" strokeDasharray="1 4.2" />
    </svg>
  );
}

function SentencaUnanime(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 30V17a4 4 0 0 1 8 0v13M25 30V17a4 4 0 0 1 8 0v13" />
      <path d="M10 30h30M14 30v6M40 30v6M14 36h26" />
      <Brilho x={24} y={11} s={1} />
    </svg>
  );
}

function BancaPermanente(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="24" r="11" />
      <rect x="20" y="6" width="8" height="7" rx="2" />
      <rect x="6" y="27" width="8" height="7" rx="2" transform="rotate(-30 10 30.5)" />
      <rect x="34" y="27" width="8" height="7" rx="2" transform="rotate(30 38 30.5)" />
    </svg>
  );
}

function CampeaoDaCorteSuprema(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 40h32M10 40V22M16 40V22M24 40V22M32 40V22M38 40V22M6 22l18-11 18 11z" />
      <path d="M17 10l3-4 2 3 2-3 2 3 2-3 3 4-4 2-2-2-2 2-2-2-2 2z" fill="currentColor" fillOpacity={0.25} />
    </svg>
  );
}

function AutoridadeDaEquipe(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 44V16" />
      <path d="M24 16l-6-6 6-4 6 4z" fill="currentColor" fillOpacity={0.25} />
      <Brilho x={18} y={26} s={0.55} />
      <Brilho x={30} y={31} s={0.55} />
      <Brilho x={18} y={36} s={0.55} />
    </svg>
  );
}

function Reeleicao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 8c9 0 16 6 16 15 0 6-3 10-8 13l3 6-8-3-8 3 3-6c-5-3-8-7-8-13 0-9 7-15 16-15Z" />
      <path d="M18 12l3-4 3 3 3-3 3 4" fill="currentColor" fillOpacity={0.25} />
      <path d="M17 27l7-7 7 7" />
    </svg>
  );
}

export const GLIFOS_LIGA: Record<string, Glifo> = {
  "primeira-sustentacao": PrimeiraSustentacao,
  "decisao-unanime": DecisaoUnanime,
  "podio-dos-autos": PodioDosAutos,
  "presenca-confirmada": PresencaConfirmada,
  "maratonista-da-liga": MaratonistaDaLiga,
  "virada-da-semana": ViradaDaSemana,
  "foto-finish": FotoFinish,
  "elo-da-equipe": EloDaEquipe,
  "sentenca-unanime": SentencaUnanime,
  "banca-permanente": BancaPermanente,
  "campeao-da-corte-suprema": CampeaoDaCorteSuprema,
  "autoridade-da-equipe": AutoridadeDaEquipe,
  reeleicao: Reeleicao,
};
