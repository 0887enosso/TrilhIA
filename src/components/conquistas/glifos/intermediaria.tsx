import type { Glifo, GlifoProps } from "./tipos";
import { Brilho } from "./pecas";

const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function MetadeDoPrazo(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="10" width="26" height="24" rx="3" />
      <path d="M8 17h26M14 7v6M28 7v6" />
      <path d="M23 21l-5 6h4l-2 5 6-7h-4z" fill="currentColor" fillOpacity={0.22} />
    </svg>
  );
}

function PeritoAssistente(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="18" width="28" height="17" rx="3" />
      <path d="M17 18v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
      <path d="M8 25h6l2-3 3 6 2-4h9" />
      <circle cx="34" cy="14" r="4" />
      <path d="M34 12v4M32 14h4" />
    </svg>
  );
}

function GeneralistaDeConfianca(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 7l16 11-6 18H14L8 18z" />
      <path d="M24 18l4 5-4 8-4-8z" fill="currentColor" fillOpacity={0.22} />
    </svg>
  );
}

function NegociadorDeClausulas(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="14" y="6" width="20" height="26" rx="2" />
      <path d="M18 12h12M18 17h12M18 22h7" />
      <path d="M8 38c3-3 5-3 8-1l3 2c2 1 4 1 6-1l7-7" strokeWidth={2.8} />
      <path d="M32 30l5 2-2 5z" fill="currentColor" fillOpacity={0.28} />
    </svg>
  );
}

function InvestigadorDeBastidores(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 22c0-9 6-13 15-13s15 4 15 13" />
      <path d="M6 22h36" />
      <rect x="13" y="24" width="9" height="6" rx="2" />
      <rect x="26" y="24" width="9" height="6" rx="2" />
      <path d="M22 27h4" />
    </svg>
  );
}

function RedatorDePeticao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="10" y="10" width="20" height="26" rx="2" />
      <path d="M14 16h9M14 21h12" />
      <path d="M38 9c-8 3-14 9-17 17l-4 8 8-4c8-3 14-9 17-17z" fill="currentColor" fillOpacity={0.18} />
      <Brilho x={33} y={14} s={0.8} />
    </svg>
  );
}

function SemPerderORitmo(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 24h7l3-9 5 18 4-13 3 4h14" />
    </svg>
  );
}

function ImpecavelTrilhaIntermediaria(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 9h18v8c0 6-4 10-9 10s-9-4-9-10z" />
      <path d="M15 11H9v3c0 4 3 6 6 6M33 11h6v3c0 4-3 6-6 6" />
      <path d="M24 27v6M18 40h12l-1.5-4h-9z" />
      <Brilho x={24} y={13} s={1} />
      <Brilho x={16} y={7} s={0.6} />
      <Brilho x={32} y={7} s={0.6} />
    </svg>
  );
}

function TogaDeOuro(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="24" cy="14" r="7" />
      <path d="M13 41c0-11 4-14 11-14s11 3 11 14" />
      <Brilho x={14} y={30} s={0.7} />
      <Brilho x={34} y={30} s={0.7} />
      <Brilho x={24} y={35} s={0.7} />
    </svg>
  );
}

function PioneiroDaEquipe(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 41 22 12l4 8 4-4 8 25z" />
      <path d="M22 12v6" />
      <path d="M24 20v-9l9 4-9 4Z" fill="currentColor" fillOpacity={0.25} />
    </svg>
  );
}

function SprintDaTrilha(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 15l14 14M20 12l16 16" strokeWidth={4.5} />
      <path d="M34 28l6-3-3 6z" fill="currentColor" stroke="none" />
      <path d="M8 24h6M6 30h6M10 18h5" opacity={0.6} />
    </svg>
  );
}

function EntregaImpecavel(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="11" y="9" width="22" height="30" rx="3" />
      <path d="M18 6h8a2 2 0 0 1 2 2v2H16V8a2 2 0 0 1 2-2Z" />
      <path d="M16 20l2.5 2.5L23 17M16 27l2.5 2.5L23 24" />
      <circle cx="34" cy="34" r="6" fill="currentColor" fillOpacity={0.2} />
      <path d="M31.5 34l1.8 1.8L36 32" />
    </svg>
  );
}

export const GLIFOS_INTERMEDIARIA: Record<string, Glifo> = {
  "metade-do-prazo": MetadeDoPrazo,
  "perito-assistente": PeritoAssistente,
  "generalista-de-confianca": GeneralistaDeConfianca,
  "negociador-de-clausulas": NegociadorDeClausulas,
  "investigador-de-bastidores": InvestigadorDeBastidores,
  "redator-de-peticao": RedatorDePeticao,
  "sem-perder-o-ritmo": SemPerderORitmo,
  "impecavel-trilha-intermediaria": ImpecavelTrilhaIntermediaria,
  "toga-de-ouro": TogaDeOuro,
  "pioneiro-da-equipe": PioneiroDaEquipe,
  "sprint-da-trilha": SprintDaTrilha,
  "entrega-impecavel": EntregaImpecavel,
};
