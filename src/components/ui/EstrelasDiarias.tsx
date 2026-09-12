import { IconeEstrela } from "./iconesJogo";

const LIMITE_DIARIO = 2;

/** Estrelas diárias — quantos módulos NOVOS ainda cabem hoje (ver docs/gamificacao.md). */
export function EstrelasDiarias({
  restantes,
  tamanho = 20,
  className = "",
}: {
  restantes: number;
  tamanho?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={`${restantes} de ${LIMITE_DIARIO} estrelas diárias restantes`}
      title={`${restantes} de ${LIMITE_DIARIO} módulos novos disponíveis hoje`}
    >
      {Array.from({ length: LIMITE_DIARIO }, (_, i) => (
        <IconeEstrela key={i} cheia={i < restantes} tamanho={tamanho} />
      ))}
    </div>
  );
}
