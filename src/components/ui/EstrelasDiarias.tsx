const LIMITE_DIARIO = 2;

export function EstrelasDiarias({ restantes, className = "" }: { restantes: number; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`${restantes} de ${LIMITE_DIARIO} estrelas diárias restantes`}
    >
      {Array.from({ length: LIMITE_DIARIO }, (_, i) => (
        <span key={i} className={i < restantes ? "text-amber" : "text-rule-strong"} aria-hidden="true">
          {i < restantes ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}
