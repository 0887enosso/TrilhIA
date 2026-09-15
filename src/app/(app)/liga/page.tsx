import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterRankingSemanalDoUsuario } from "@/lib/ligas";
import { Mascote } from "@/components/mascote/Mascote";
import { BadgePill } from "@/components/ui/BadgePill";
import { IconeXp } from "@/components/ui/iconesJogo";
import { IconeTrofeu } from "@/components/app/icones";
import { SecaoVazia } from "@/components/ui/SecaoVazia";

// Medalhas do pódio: em vez dos emojis de medalha (que renderizam diferente
// em cada sistema e destoam do resto da iconografia), um selo desenhado com
// as mesmas cores do sistema — ouro, prata e bronze derivados da paleta.
const PODIO: Record<number, { fundo: string; borda: string; texto: string }> = {
  1: { fundo: "bg-amber-vivid", borda: "border-amber-strong", texto: "text-ink" },
  2: { fundo: "bg-rule-strong", borda: "border-ink-faint", texto: "text-ink" },
  3: { fundo: "bg-coral", borda: "border-coral-strong", texto: "text-parchment-surface" },
};

function SeloPosicao({ posicao }: { posicao: number }) {
  const estilo = PODIO[posicao];

  if (!estilo) {
    return (
      <span className="font-variant-tabular flex h-9 w-9 flex-none items-center justify-center text-sm font-extrabold text-ink-faint">
        {posicao}
      </span>
    );
  }

  return (
    <span
      className={`font-variant-tabular flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-sm font-extrabold ${estilo.fundo} ${estilo.borda} ${estilo.texto}`}
    >
      {posicao}
    </span>
  );
}

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

      {/* Sem este caso, um usuário sem nenhuma liga elegível via só o título e
          um vazio absoluto embaixo — nada explicando por quê. */}
      {ligas.length === 0 ? (
        <SecaoVazia pose="pensando">
          Você ainda não participa de nenhuma liga. As ligas são organizadas por equipe e a sua
          aparece aqui assim que houver uma ativa.
        </SecaoVazia>
      ) : null}

      {ligas.map((liga) => (
        <section key={liga.ligaId} className="rounded-3xl border-2 border-rule bg-parchment-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-xl font-extrabold text-ink">{liga.nome}</h2>
            {liga.tipo === "EXCLUSIVA" ? <BadgePill cor="amber">Liga exclusiva</BadgePill> : null}
          </div>

          {liga.participantes.length === 0 ? (
            <SecaoVazia pose="andando">
              Ninguém pontuou nesta liga ainda esta semana. Responda uma questão e você assume a
              liderança.
            </SecaoVazia>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {liga.participantes.map((p) => (
                <li
                  key={p.usuarioId}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-sm transition-colors ${
                    p.voce
                      ? "border-jade bg-jade-soft text-jade-strong shadow-press-rule"
                      : p.posicao <= 3
                        ? "border-amber-soft bg-amber-soft/60 text-ink"
                        : "border-transparent text-ink"
                  }`}
                >
                  <SeloPosicao posicao={p.posicao} />
                  {p.posicao === 1 ? <Mascote pose="comemorando" size={36} /> : null}
                  <span className="flex-1 font-extrabold">
                    {p.nome}
                    {p.voce ? " (você)" : ""}
                  </span>
                  <span className="font-variant-tabular flex items-center gap-1 rounded-full border-2 border-rule bg-parchment-surface px-2.5 py-1 text-xs font-extrabold text-amber-strong">
                    <IconeXp tamanho={14} />
                    {p.xpNaSemana}
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
