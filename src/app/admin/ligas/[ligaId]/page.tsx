import Link from "next/link";
import { notFound } from "next/navigation";
import { obterRankingAdminDaLiga } from "@/lib/ligas";
import { BadgePill } from "@/components/ui/BadgePill";

export default async function AdminLigaRankingPage({
  params,
}: {
  params: Promise<{ ligaId: string }>;
}) {
  const { ligaId } = await params;
  const dados = await obterRankingAdminDaLiga(ligaId);
  if (!dados) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/ligas" className="text-sm text-ink-soft hover:underline">
          ← Voltar para Ligas
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-2xl text-ink">{dados.liga.nome}</h1>
          <BadgePill cor={dados.liga.tipo === "EXCLUSIVA" ? "amber" : "trail"}>{dados.liga.tipo}</BadgePill>
        </div>
        <p className="mt-1 font-mono text-xs text-ink-faint">Semana {dados.semana}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-rule">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-surface font-mono text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Posição</th>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Equipe</th>
              <th className="px-4 py-3">XP na semana</th>
            </tr>
          </thead>
          <tbody>
            {dados.ranking.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Ninguém pontuou nesta liga ainda esta semana.
                </td>
              </tr>
            ) : (
              dados.ranking.map((p) => (
                <tr key={p.posicao} className="border-t border-rule">
                  <td className="px-4 py-3 font-mono font-bold text-ink-faint">{p.posicao}</td>
                  <td className="px-4 py-3 font-medium text-ink">{p.usuario}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.equipe}</td>
                  <td className="px-4 py-3 font-mono">{p.xpNaSemana} XP</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
