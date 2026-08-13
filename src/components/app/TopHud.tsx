import { Coracoes } from "@/components/ui/Coracoes";
import { ContadorCoracoes } from "@/components/ui/ContadorCoracoes";
import { EstrelasDiarias } from "@/components/ui/EstrelasDiarias";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { CountUp } from "@/components/reactbits/CountUp";
import { StarBorder } from "@/components/reactbits/StarBorder";
import type { ResumoUsuario } from "@/lib/usuario";

/** Barra de status do jogo (streak/corações/estrelas/XP) — sempre visível, fica no topo da área de conteúdo (a navegação em si mora na Sidebar). */
export function TopHud({ usuario }: { usuario: ResumoUsuario }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-end gap-4 border-b-2 border-rule bg-parchment/95 px-4 py-2.5 font-mono text-sm backdrop-blur print:hidden sm:gap-5">
      <StreakBadge dias={usuario.streakAtual} freezes={usuario.streakFreezesDisponiveis} />
      <div className="flex flex-col items-end gap-0.5">
        <Coracoes atuais={usuario.coracoesAtuais} />
        <ContadorCoracoes liberamEm={usuario.coracoesLiberamEm} />
      </div>
      <StarBorder thickness={1.5} speed="4s">
        <span className="block bg-parchment px-2 py-0.5 rounded-[15px]">
          <EstrelasDiarias restantes={usuario.estrelasDiariasRestantes} />
        </span>
      </StarBorder>
      <span className="rounded-full bg-amber-soft px-2.5 py-1 font-variant-tabular font-extrabold text-amber-strong">
        <CountUp to={usuario.xpTotal} duration={1} /> XP
      </span>
    </div>
  );
}
