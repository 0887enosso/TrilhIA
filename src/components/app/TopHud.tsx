import { Coracoes } from "@/components/ui/Coracoes";
import { ContadorCoracoes } from "@/components/ui/ContadorCoracoes";
import { EstrelasDiarias } from "@/components/ui/EstrelasDiarias";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { IconeXp } from "@/components/ui/iconesJogo";
import { CountUp } from "@/components/reactbits/CountUp";
import { StarBorder } from "@/components/reactbits/StarBorder";
import type { ResumoUsuario } from "@/lib/usuario";

/**
 * Barra de status do jogo (nível, XP, foguinho, vidas, estrelas) — sempre
 * visível no topo da área de conteúdo; a navegação em si mora na Sidebar.
 *
 * Cada estatística é uma "ficha" com contorno próprio, em vez de itens
 * soltos separados por espaço: agrupados assim, eles leem como um painel de
 * jogo, e cada número ganha uma moldura que o destaca do fundo de
 * pergaminho. O nível passou a aparecer aqui — antes só existia como texto
 * solto no dashboard, apesar de ser o principal indicador de avanço.
 */
function Ficha({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border-2 border-rule bg-parchment-surface px-3 py-1.5 ${className}`}
    >
      {children}
    </div>
  );
}

export function TopHud({ usuario }: { usuario: ResumoUsuario }) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-end gap-2 border-b-2 border-rule bg-parchment/95 px-4 py-2.5 backdrop-blur print:hidden sm:gap-3">
      <Ficha className="border-trail bg-trail text-parchment-surface">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Nível</span>
        <span className="font-variant-tabular text-sm font-extrabold">{usuario.nivel}</span>
      </Ficha>

      <Ficha className="border-amber-strong bg-amber-soft">
        <IconeXp tamanho={18} />
        <span className="font-variant-tabular text-sm font-extrabold text-amber-strong">
          <CountUp to={usuario.xpTotal} duration={1} /> XP
        </span>
      </Ficha>

      <Ficha>
        <StreakBadge dias={usuario.streakAtual} freezes={usuario.streakFreezesDisponiveis} />
      </Ficha>

      <Ficha className="flex-col !items-end gap-0 py-1">
        <Coracoes atuais={usuario.coracoesAtuais} tamanho={20} />
        <ContadorCoracoes liberamEm={usuario.coracoesLiberamEm} curto />
      </Ficha>

      <StarBorder thickness={1.5} speed="4s">
        <span className="block rounded-[15px] bg-parchment px-2.5 py-1">
          <EstrelasDiarias restantes={usuario.estrelasDiariasRestantes} />
        </span>
      </StarBorder>
    </div>
  );
}
