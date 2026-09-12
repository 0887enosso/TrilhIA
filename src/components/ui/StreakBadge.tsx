import { IconeChama, IconeGelo } from "./iconesJogo";

/**
 * Foguinho de engajamento. Zerado, a chama aparece apagada (cinza de
 * pergaminho) em vez de simplesmente sumir — o espaço vazio guardado
 * comunica "você ainda não acendeu isso hoje", que é o gancho que faz o
 * usuário voltar. Ver docs/gamificacao.md: o foguinho é monitor do desafio
 * diário, não de uso geral do app.
 */
export function StreakBadge({ dias, freezes }: { dias: number; freezes: number }) {
  const aceso = dias > 0;

  return (
    <div
      className="flex items-center gap-1.5"
      title={`Foguinho: avança 1 a cada desafio diário concluído, zera se um dia passar sem concluir nenhum.${
        freezes > 0 ? ` ${freezes} congelamento(s) disponível(is).` : ""
      }`}
    >
      <IconeChama apagada={!aceso} tamanho={22} />
      <span
        className={`font-variant-tabular text-sm font-extrabold ${aceso ? "text-ink" : "text-ink-faint"}`}
      >
        {dias}
      </span>
      <span className="hidden text-xs font-bold text-ink-soft sm:inline">
        {dias === 1 ? "dia" : "dias"}
      </span>
      {freezes > 0 ? (
        <span className="ml-0.5 flex items-center gap-0.5" aria-label={`${freezes} congelamento disponível`}>
          <IconeGelo tamanho={16} />
          <span className="font-variant-tabular text-xs font-bold text-ink-faint">{freezes}</span>
        </span>
      ) : null}
    </div>
  );
}
