import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterConquistasDoUsuario } from "@/lib/conquistas";
import { Mascote } from "@/components/mascote/Mascote";
import { ImprimirBotao } from "@/components/app/ImprimirBotao";
import { MagicCard } from "@/components/reactbits/MagicCard";
import { IconeConquista } from "@/components/conquistas/IconeConquista";
import { SecaoVazia } from "@/components/ui/SecaoVazia";
import { EMBLEMAS_BADGE_IDS } from "@/lib/catalogoConquistas";

export default async function ConquistasPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const { badges, certificados } = await obterConquistasDoUsuario(sessao.usuarioId);
  const emblemas = badges.filter((b) => b.tipo === "EMBLEMA");
  const trofeus = badges.filter((b) => b.tipo === "TROFEU");

  // Quantos emblemas existem ao todo — o catálogo é a fonte da verdade
  // (src/lib/catalogoConquistas.ts), a mesma lista usada para decidir o
  // troféu Tribunal Pleno.
  const totalEmblemas = EMBLEMAS_BADGE_IDS.length;
  const percentual = Math.round((emblemas.length / totalEmblemas) * 100);

  return (
    <div className="flex flex-col gap-10">
      {/* Sem este cabeçalho a página abria direto em "Emblemas" e, numa conta
          nova, não dizia quantos existem — o usuário via um cartão solto e
          nenhuma noção de escala nem de progresso. O contador dá as duas
          coisas sem precisar listar os 44 emblemas bloqueados. */}
      <header className="rounded-3xl border-2 border-rule bg-parchment-surface p-6">
        <h1 className="font-sans text-2xl font-extrabold text-ink">Conquistas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Emblemas marcam avanço na trilha e constância; troféus são os feitos mais raros.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-rule bg-parchment-deep">
            <div
              className="h-full rounded-full bg-jade transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <span className="font-variant-tabular flex-none text-sm font-extrabold text-ink-soft">
            {emblemas.length} de {totalEmblemas} emblemas
          </span>
        </div>
      </header>

      <section>
        <h1 className="font-sans text-2xl font-extrabold text-ink">Emblemas</h1>
        {emblemas.length === 0 ? (
          <SecaoVazia pose="andando">
            Nenhum emblema ainda — conclua um módulo da trilha para conquistar o primeiro.
          </SecaoVazia>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {emblemas.map((badge) => (
              <MagicCard
                key={badge.badgeId}
                glowColor="51, 81, 60"
                className="rounded-3xl border-2 border-trail-soft bg-parchment-surface transition-all hover:-translate-y-0.5 hover:border-trail hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2 p-5 text-center">
                  <IconeConquista badgeId={badge.badgeId} tipo={badge.tipo} size={80} />
                  <h3 className="font-sans text-base font-extrabold text-ink">{badge.nomeBadge}</h3>
                  <p className="text-sm text-ink-soft">{badge.descricao}</p>
                  <p className="font-variant-tabular text-xs font-bold text-ink-faint">
                    {new Date(badge.conquistadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </MagicCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <h1 className="font-sans text-2xl font-extrabold text-ink">Troféus</h1>
        {trofeus.length === 0 ? (
          <SecaoVazia pose="pensando">
            Nenhum troféu ainda — troféus marcam as conquistas mais raras e difíceis do TrilhIA.
          </SecaoVazia>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trofeus.map((badge) => (
              <MagicCard
                key={badge.badgeId}
                glowColor="169, 112, 15"
                className="rounded-3xl border-2 border-amber-soft bg-parchment-surface transition-all hover:-translate-y-0.5 hover:border-amber hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2 p-5 text-center">
                  <IconeConquista badgeId={badge.badgeId} tipo={badge.tipo} size={80} />
                  <h3 className="font-sans text-base font-extrabold text-ink">{badge.nomeBadge}</h3>
                  <p className="text-sm text-ink-soft">{badge.descricao}</p>
                  <p className="font-variant-tabular text-xs font-bold text-ink-faint">
                    {new Date(badge.conquistadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </MagicCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <h1 className="font-sans text-2xl font-extrabold text-ink">Certificados</h1>
        {certificados.length === 0 ? (
          <SecaoVazia pose="sentado">
            Nenhum certificado ainda — conclua uma trilha inteira para emitir o seu.
          </SecaoVazia>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {certificados.map((certificado) => (
              <div
                key={certificado.trilha}
                className="flex flex-col items-center gap-4 rounded-3xl border-[3px] border-amber bg-parchment-surface p-8 text-center shadow-[0_6px_0_#8A5B0C] print:border-none print:shadow-none"
              >
                <Mascote pose="certificado" size={110} />
                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-strong">
                  {certificado.titulo}
                </p>
                <p className="max-w-xl font-display text-lg leading-relaxed text-ink">{certificado.texto}</p>
                <p className="font-variant-tabular text-xs text-ink-faint">
                  Emitido em {new Date(certificado.emitidoEm).toLocaleDateString("pt-BR")}
                </p>
                <span className="print:hidden">
                  <ImprimirBotao />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
