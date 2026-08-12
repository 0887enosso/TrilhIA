export function StreakBadge({ dias, freezes }: { dias: number; freezes: number }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm text-ink-soft" title={`${freezes} congelamento(s) de streak disponível`}>
      <span className="text-coral" aria-hidden="true">🔥</span>
      <span className="font-variant-tabular font-semibold text-ink">{dias}</span>
      <span className="hidden sm:inline">{dias === 1 ? "dia seguido" : "dias seguidos"}</span>
      {freezes > 0 ? <span className="text-ink-faint" aria-hidden="true">❄ {freezes}</span> : null}
    </div>
  );
}
