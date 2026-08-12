const TOTAL_CORACOES = 5;

export function Coracoes({ atuais, className = "" }: { atuais: number; className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${atuais} de ${TOTAL_CORACOES} corações`}>
      {Array.from({ length: TOTAL_CORACOES }, (_, i) => (
        <span key={i} className={i < atuais ? "text-coral" : "text-rule-strong"} aria-hidden="true">
          {i < atuais ? "♥" : "♡"}
        </span>
      ))}
    </div>
  );
}
