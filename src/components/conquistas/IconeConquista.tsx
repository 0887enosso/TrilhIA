import { Mascote } from "@/components/mascote/Mascote";
import { GLIFOS_BASICA } from "./glifos/basica";
import { GLIFOS_INTERMEDIARIA } from "./glifos/intermediaria";
import { GLIFOS_ENGAJAMENTO } from "./glifos/engajamento";
import { GLIFOS_LIGA } from "./glifos/liga";
import { GLIFOS_MAESTRIA } from "./glifos/maestria";
import type { Glifo } from "./glifos/tipos";

const GLIFOS: Record<string, Glifo> = {
  ...GLIFOS_BASICA,
  ...GLIFOS_INTERMEDIARIA,
  ...GLIFOS_ENGAJAMENTO,
  ...GLIFOS_LIGA,
  ...GLIFOS_MAESTRIA,
};

// "trail" (verde estrutural) pros emblemas, "amber" (destaque de gamificação,
// já usado em XP/estrelas) pros troféus — reaproveita a paleta que já existe
// em tailwind.config.ts em vez de inventar uma cor "gold" nova só pra isso.
const PLACA = {
  EMBLEMA: { fundo: "#33513C", anel: "#4E7059" },
  TROFEU: { fundo: "#8A5B0C", anel: "#C6912E" },
} as const;

/**
 * Ícone de uma conquista (emblema ou troféu), com placa colorida por tipo.
 * Badges sem glifo próprio (as 7 estruturais da Fase 2, concedidas antes
 * deste catálogo existir) caem no mascote genérico — nunca quebra, só fica
 * menos específico visualmente.
 */
export function IconeConquista({
  badgeId,
  tipo,
  size = 56,
}: {
  badgeId: string;
  tipo: "EMBLEMA" | "TROFEU";
  size?: number;
}) {
  const Glifo = GLIFOS[badgeId];
  const cor = PLACA[tipo];
  const tamanhoGlifo = Math.round(size * 0.56);

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: cor.fundo, boxShadow: `inset 0 0 0 2px ${cor.anel}` }}
    >
      {Glifo ? (
        <Glifo width={tamanhoGlifo} height={tamanhoGlifo} style={{ color: "#FBF6E8" }} />
      ) : (
        <Mascote pose="comemorando" size={Math.round(size * 0.72)} />
      )}
    </div>
  );
}
