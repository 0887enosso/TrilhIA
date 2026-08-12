import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterResumoUsuario } from "@/lib/usuario";
import { obterProgressoAgregado } from "@/lib/progresso";
import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";
import { IconeRaio, IconeTrofeu, IconeCadeado, IconeBussola } from "@/components/app/icones";
import { GlareHover } from "@/components/reactbits/GlareHover";
import type { TrilhaId } from "@/lib/content";

const NOME_TRILHA: Record<TrilhaId, string> = {
  basica: "Trilha Básica",
  intermediaria: "Trilha Intermediária",
};

export default async function InicioPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const [usuario, progresso] = await Promise.all([
    obterResumoUsuario(sessao.usuarioId),
    obterProgressoAgregado(sessao.usuarioId),
  ]);
  if (!usuario) redirect("/login");

  // Só existe UMA trilha "ativa" por vez — sem escolha livre entre as duas.
  // Foca na básica até ela ser 100% concluída; só então a intermediária libera.
  const trilhaAtiva: TrilhaId = progresso.basica.trilhaConcluida ? "intermediaria" : "basica";
  const dadosTrilhaAtiva = progresso[trilhaAtiva];
  const modulosDaTrilhaAtiva = dadosTrilhaAtiva.modulos;
  const proximoModulo =
    modulosDaTrilhaAtiva.find((m) => m.status === "em_andamento") ??
    modulosDaTrilhaAtiva.find((m) => m.status === "nao_iniciado");
  const percentualAtivo = Math.round((dadosTrilhaAtiva.concluidos / dadosTrilhaAtiva.totalModulos) * 100);

  return (
    <div className="flex flex-col gap-8">
      <section className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border-2 border-rule bg-parchment-surface p-8 text-center sm:flex-row sm:text-left">
        <IconeBussola className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-trail opacity-[0.07]" />
        <Mascote pose="andando" size={110} className="relative" />
        <div className="relative flex-1">
          <p className="font-mono text-xs uppercase tracking-wide text-trail">Bem-vindo(a) de volta</p>
          <h1 className="mt-1 font-sans text-3xl font-extrabold text-ink">Olá, {usuario.nome.split(" ")[0]}</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Nível {usuario.nivel} · {usuario.xpTotal} XP acumulados · Equipe {usuario.equipe}
          </p>
        </div>
      </section>

      {proximoModulo ? (
        <section className="flex flex-col items-start gap-3 rounded-3xl border-2 border-rule bg-parchment-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
              Continue de onde parou · {NOME_TRILHA[trilhaAtiva]}
            </p>
            <h2 className="mt-1 font-sans text-xl font-extrabold text-ink">{proximoModulo.titulo}</h2>
            <p className="mt-1 text-sm text-ink-soft">{proximoModulo.descricao_curta}</p>
          </div>
          <Link href={`/trilha/${trilhaAtiva}/${proximoModulo.modulo_id}`}>
            <Botao>{proximoModulo.status === "em_andamento" ? "Continuar módulo" : "Começar módulo"}</Botao>
          </Link>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-3xl border-2 border-rule bg-parchment-surface p-6 text-center">
          <Mascote pose="certificado" size={96} />
          <p className="text-sm text-ink-soft">
            Você concluiu as duas trilhas — confira suas conquistas e certificados.
          </p>
          <Link href="/conquistas">
            <Botao>Ver conquistas</Botao>
          </Link>
        </section>
      )}

      {/* Uma trilha só, no ritmo do jogo: a próxima vem bloqueada até esta acabar. */}
      <section className="grid gap-4 sm:grid-cols-2">
        <GlareHover className="rounded-3xl border-2 border-rule bg-parchment-surface transition-all hover:-translate-y-0.5 hover:border-trail hover:shadow-lg" glareOpacity={0.25}>
          <Link href={`/trilha/${trilhaAtiva}`} className="flex h-full flex-col gap-2 p-5">
            <h3 className="font-sans text-lg font-extrabold text-ink">{NOME_TRILHA[trilhaAtiva]}</h3>
            <p className="font-variant-tabular text-sm font-semibold text-ink-soft">
              {dadosTrilhaAtiva.concluidos} de {dadosTrilhaAtiva.totalModulos} módulos concluídos
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-rule">
              <div
                className="h-full rounded-full bg-trail transition-[width] duration-500"
                style={{ width: `${percentualAtivo}%` }}
              />
            </div>
          </Link>
        </GlareHover>

        {trilhaAtiva === "basica" ? (
          <div className="flex flex-col justify-center gap-2 rounded-3xl border-2 border-dashed border-rule-strong bg-parchment p-5 text-ink-faint">
            <div className="flex items-center gap-2">
              <IconeCadeado className="h-5 w-5" />
              <h3 className="font-sans text-lg font-extrabold">Trilha Intermediária</h3>
            </div>
            <p className="text-sm">Desbloqueia ao concluir todos os 10 módulos da Trilha Básica.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-3xl border-2 border-trail-soft bg-trail-soft p-5 text-trail-strong">
            <Mascote pose="certificado" size={44} />
            <p className="text-sm font-bold">Trilha Básica concluída — certificado emitido!</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
        <Link
          href="/desafio-diario"
          className="btn-blaze flex items-center justify-between rounded-3xl p-6 text-white"
        >
          <div>
            <p className="flex items-center gap-2 font-sans text-xl font-extrabold">
              <IconeRaio className="h-6 w-6" /> Desafio diário
            </p>
            <p className="mt-1 text-sm font-semibold text-white/90">5 questões de revisão · +30 XP de bônus</p>
          </div>
          <Mascote pose="pensando" size={64} />
        </Link>
        <GlareHover className="rounded-3xl border-2 border-rule bg-parchment-surface transition-all hover:-translate-y-0.5 hover:border-amber hover:shadow-lg" glareOpacity={0.3} glareColor="#E3A63F">
          <Link href="/liga" className="flex h-full items-center justify-between p-6">
            <div>
              <p className="flex items-center gap-2 font-sans text-lg font-extrabold text-ink">
                <IconeTrofeu className="h-5 w-5 text-amber-strong" /> Sua liga
              </p>
              <p className="mt-1 text-sm text-ink-soft">Ranking semanal</p>
            </div>
          </Link>
        </GlareHover>
      </section>
    </div>
  );
}
