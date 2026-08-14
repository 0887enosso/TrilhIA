import type { Glifo, GlifoProps } from "./tipos";
import { Brilho } from "./pecas";

const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function PrimeiroProtocolo(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="13" y="7" width="22" height="34" rx="3" />
      <path d="M18 15h12M18 21h12M18 27h7" />
      <circle cx="31" cy="33" r="7" fill="currentColor" fillOpacity={0.2} />
      <path d="M28.3 33l1.8 1.8L33.7 31" />
    </svg>
  );
}

function MetadeDoCaminho(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 38l14-24 6 9 6-6 10 21z" />
      <path d="M23 20l-3 5h6z" fill="currentColor" fillOpacity={0.25} stroke="none" />
      <path d="M24 8v9M24 8l5 3-5 3" strokeLinejoin="round" />
    </svg>
  );
}

function BoaPerguntaBoaResposta(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 14a4 4 0 0 1 4-4h13a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H16l-6 5v-5a4 4 0 0 1-4-4z" />
      <path d="M21 20a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4v4l-5-4h-4a4 4 0 0 1-4-4z" />
      <circle cx="34" cy="24" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="29" cy="24" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GuardiaoDaInformacao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 6l13 5v10c0 9-5.5 15.5-13 19-7.5-3.5-13-10-13-19V11z" />
      <rect x="19" y="22" width="10" height="8" rx="1.5" />
      <path d="M21.5 22v-3a2.5 2.5 0 0 1 5 0v3" />
    </svg>
  );
}

function OlhoClinico(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="20" cy="20" r="10" />
      <path d="M27 27l11 11" />
      <path d="M15.5 18.5c1.5-2 3-2.5 4.5-2.5s3 .5 4.5 2.5c-1.5 2-3 2.5-4.5 2.5s-3-.5-4.5-2.5Z" fill="currentColor" fillOpacity={0.2} />
      <circle cx="20" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SemDeslizes(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="22" cy="24" r="13" />
      <circle cx="22" cy="24" r="7.5" />
      <circle cx="22" cy="24" r="2" fill="currentColor" stroke="none" />
      <Brilho x={34} y={12} s={0.9} />
    </svg>
  );
}

function TogaImpecavel(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="24" cy="12" rx="7" ry="4" />
      <path d="M14 15c0 10 3 8 3 20h14c0-12 3-10 3-20" />
      <path d="M24 16v18" />
      <Brilho x={24} y={7} s={1.1} />
    </svg>
  );
}

function SentencaPrimeiraInstancia(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M26 6 15 26h8l-3 16 15-22h-8z" fill="currentColor" fillOpacity={0.18} />
      <path d="M32 30c3 0 5 2 5 5s-2 5-5 5" strokeLinecap="round" />
      <path d="M40 30l-2 2M40 40l-2-2" />
    </svg>
  );
}

function PrimeiraTurmaDaOab(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="14" width="26" height="18" rx="3" />
      <circle cx="18" cy="23" r="4.5" />
      <path d="M25 19h8M25 24h8M25 28h5" />
      <path d="M36 34l4 8-6-2-6 2 4-8" fill="currentColor" fillOpacity={0.18} />
    </svg>
  );
}

function SemPerderOPrazo(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 8h20M14 40h20M16 8c0 9 5 10 8 12-3 2-8 3-8 12M32 8c0 9-5 10-8 12 3 2 8 3 8 12" />
      <circle cx="24" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="32" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SegundaChamada(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 40C13 33 8 26.5 8 19.5 8 14.3 12 10 17 10c3 0 5.5 1.6 7 4 1.5-2.4 4-4 7-4 5 0 9 4.3 9 9.5 0 7-5 13.5-16 20.5Z" />
      <path d="M18 20l3 4-2 3 4 4" />
    </svg>
  );
}

export const GLIFOS_BASICA: Record<string, Glifo> = {
  "primeiro-protocolo": PrimeiroProtocolo,
  "metade-do-caminho": MetadeDoCaminho,
  "boa-pergunta-boa-resposta": BoaPerguntaBoaResposta,
  "guardiao-da-informacao": GuardiaoDaInformacao,
  "olho-clinico": OlhoClinico,
  "sem-deslizes": SemDeslizes,
  "trilha-basica-toga-impecavel": TogaImpecavel,
  "trilha-basica-sentenca-primeira-instancia": SentencaPrimeiraInstancia,
  "trilha-basica-primeira-turma-oab": PrimeiraTurmaDaOab,
  "trilha-basica-sem-perder-o-prazo": SemPerderOPrazo,
  "trilha-basica-segunda-chamada": SegundaChamada,
};
