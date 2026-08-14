import type { Glifo, GlifoProps } from "./tipos";
import { Brilho, Chama } from "./pecas";

const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function FosforoAceso(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 40l6-24" />
      <Chama transform="translate(20 4) scale(0.62)" />
    </svg>
  );
}

function BrasaFirme(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <Chama transform="translate(1 4) scale(0.92)" />
      <Chama transform="translate(-14 22) scale(0.4)" />
      <Chama transform="translate(15 22) scale(0.4)" />
    </svg>
  );
}

function UmaSemanaDePlantao(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <Chama transform="translate(1 2) scale(0.75)" />
      <path d="M10 22a14 9 0 0 1 28 0z" strokeWidth={2.8} />
      <path d="M10 22h28" strokeWidth={2.8} />
    </svg>
  );
}

function HabitoProtocolado(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <Chama transform="translate(1 6) scale(0.92)" />
      <rect x="6" y="24" width="30" height="10" rx="2" transform="rotate(-8 21 29)" strokeWidth={2.8} />
    </svg>
  );
}

function SocioDoHabito(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <Chama transform="translate(1 4) scale(0.92)" />
      <path d="M21 30l3 4 3-4-3-3z" fill="currentColor" fillOpacity={0.25} />
      <path d="M24 31v9" />
    </svg>
  );
}

function PedidoDeVista(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 7v34M11 15l26 18M37 15L11 33" />
      <Chama transform="translate(0 12) scale(0.42)" />
    </svg>
  );
}

function ReservaTecnicaCompleta(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="30" height="30" rx="3" />
      <circle cx="24" cy="24" r="5" />
      <path d="M17 15l3 3M31 15l-3 3M17 33l3-3M31 33l-3-3" />
    </svg>
  );
}

function RecordePessoal(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 42V6" strokeWidth={2.8} />
      <path d="M10 36h5M10 29h7M10 22h5M10 15h7" strokeWidth={2.8} />
      <Chama transform="translate(9 -3) scale(1.15)" />
    </svg>
  );
}

function PraxeFirmada(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 44h8l-2-10h-4z" />
      <path d="M18 34h12l-2-8H20z" />
      <Chama transform="translate(1 2) scale(0.8)" />
      <Brilho x={34} y={12} s={0.8} />
    </svg>
  );
}

function PrecedenteConsolidado(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 16c5-2 10-2 15 0v20c-5-2-10-2-15 0zM38 16c-5-2-10-2-15 0v20c5-2 10-2 15 0z" />
      <Chama transform="translate(0 2) scale(0.55)" />
    </svg>
  );
}

function TrimestreImpecavel(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <Chama transform="translate(1 6) scale(0.85)" />
      <Chama transform="translate(-13 14) scale(0.55)" />
      <Chama transform="translate(15 14) scale(0.55)" />
      <path d="M10 40c4-3 8-3 14-3s10 0 14 3" opacity={0.7} />
    </svg>
  );
}

function PrazoPeremptorio(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M24 40V22M14 40h20M17 22c0-6 3-9 7-9s7 3 7 9M11 22c0-4 2-6 5-6M37 22c0-4-2-6-5-6" />
      <Chama transform="translate(1 0) scale(0.5)" />
      <Chama transform="translate(-12 4) scale(0.32)" />
      <Chama transform="translate(14 4) scale(0.32)" />
    </svg>
  );
}

function RecursoProvido(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 26l4-6 4 3 5-8 4 5 4-3-3 9z" />
      <Chama transform="translate(1 -1) scale(0.62)" />
    </svg>
  );
}

function TransitoEmJulgado(props: GlifoProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="16" width="22" height="16" rx="2" />
      <path d="M14 20v8M20 20v8M24 24h2" strokeWidth={2.2} />
      <path d="M33 30l7-9M33 21l4-2 3 3-4 2z" fill="currentColor" fillOpacity={0.25} />
    </svg>
  );
}

export const GLIFOS_ENGAJAMENTO: Record<string, Glifo> = {
  "fosforo-aceso": FosforoAceso,
  "brasa-firme": BrasaFirme,
  "uma-semana-de-plantao": UmaSemanaDePlantao,
  "habito-protocolado": HabitoProtocolado,
  "socio-do-habito": SocioDoHabito,
  "pedido-de-vista": PedidoDeVista,
  "reserva-tecnica-completa": ReservaTecnicaCompleta,
  "recorde-pessoal": RecordePessoal,
  "praxe-firmada": PraxeFirmada,
  "precedente-consolidado": PrecedenteConsolidado,
  "trimestre-impecavel": TrimestreImpecavel,
  "prazo-peremptorio": PrazoPeremptorio,
  "recurso-provido": RecursoProvido,
  "transito-em-julgado": TransitoEmJulgado,
};
