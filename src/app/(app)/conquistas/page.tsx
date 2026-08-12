import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterConquistasDoUsuario } from "@/lib/conquistas";
import { Mascote } from "@/components/mascote/Mascote";
import { ImprimirBotao } from "@/components/app/ImprimirBotao";
import { MagicCard } from "@/components/reactbits/MagicCard";

export default async function ConquistasPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const { badges, certificados } = await obterConquistasDoUsuario(sessao.usuarioId);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-sans text-2xl font-extrabold text-ink">Badges</h1>
        {badges.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Nenhuma badge ainda — conclua um bloco da trilha para conquistar a primeira.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <MagicCard
                key={badge.badgeId}
                glowColor="169, 112, 15"
                className="rounded-3xl border-2 border-amber-soft bg-parchment-surface transition-all hover:-translate-y-0.5 hover:border-amber hover:shadow-lg"
              >
                <div className="flex flex-col items-center gap-2 p-5 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-soft">
                    <Mascote pose="comemorando" size={56} />
                  </div>
                  <h3 className="font-sans text-base font-extrabold text-ink">{badge.nomeBadge}</h3>
                  <p className="text-sm text-ink-soft">{badge.descricao}</p>
                  <p className="font-mono text-xs font-bold text-ink-faint">
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
          <p className="mt-3 text-sm text-ink-soft">
            Nenhum certificado ainda — conclua uma trilha inteira para emitir o seu.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {certificados.map((certificado) => (
              <div
                key={certificado.trilha}
                className="flex flex-col items-center gap-4 rounded-3xl border-[3px] border-amber bg-parchment-surface p-8 text-center shadow-[0_6px_0_#8A5B0C] print:border-none print:shadow-none"
              >
                <Mascote pose="certificado" size={110} />
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-amber-strong">
                  {certificado.titulo}
                </p>
                <p className="max-w-xl font-display text-lg leading-relaxed text-ink">{certificado.texto}</p>
                <p className="font-mono text-xs text-ink-faint">
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
