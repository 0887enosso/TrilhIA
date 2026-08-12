import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterRankingSemanalDoUsuario } from "@/lib/ligas";
import { Mascote } from "@/components/mascote/Mascote";
import { BadgePill } from "@/components/ui/BadgePill";
import { IconeTrofeu } from "@/components/app/icones";

const MEDALHA: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function LigaPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const ligas = await obterRankingSemanalDoUsuario(sessao.usuarioId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <IconeTrofeu className="h-8 w-8 text-amber-strong" />
        <div>
          <h1 className="font-sans text-2xl font-extrabold text-ink">Sua liga</h1>
          <p className="text-sm text-ink-soft">Ranking da semana corrente, por XP acumulado.</p>
        </div>
      </div>

      {ligas.map((liga) => (
        <section key={liga.ligaId} className="rounded-3xl border-2 border-rule bg-parchment-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-xl font-extrabold text-ink">{liga.nome}</h2>
            {liga.tipo === "EXCLUSIVA" ? <BadgePill cor="amber">Liga exclusiva</BadgePill> : null}
          </div>

          {liga.participantes.length === 0 ? (
            <p className="text-sm text-ink-soft">Ninguém pontuou nesta liga ainda esta semana.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {liga.participantes.map((p) => (
                <li
                  key={p.usuarioId}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors ${
                    p.voce
                      ? "border-2 border-trail bg-trail-soft text-trail-strong"
                      : p.posicao <= 3
                        ? "bg-amber-soft text-ink"
                        : "text-ink"
                  }`}
                >
                  <span className="w-7 flex-none text-center text-base" aria-hidden="true">
                    {MEDALHA[p.posicao] ?? (
                      <span className="font-mono text-xs font-bold text-ink-faint">{p.posicao}</span>
                    )}
                  </span>
                  {p.posicao === 1 ? <Mascote pose="comemorando" size={32} /> : null}
                  <span className="flex-1 font-extrabold">
                    {p.nome}
                    {p.voce ? " (você)" : ""}
                  </span>
                  <span className="font-variant-tabular rounded-full bg-parchment px-2.5 py-1 font-mono text-xs font-extrabold text-trail-strong">
                    {p.xpNaSemana} XP
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
