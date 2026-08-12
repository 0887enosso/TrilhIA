import { prisma } from "@/lib/prisma";
import { BadgePill } from "@/components/ui/BadgePill";
import { CriarLigaForm } from "@/components/admin/CriarLigaForm";

export default async function AdminLigasPage() {
  const [ligas, equipes] = await Promise.all([
    prisma.liga.findMany({ include: { equipe: { select: { nome: true } } }, orderBy: { nome: "asc" } }),
    prisma.equipe.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Ligas</h1>

      <div className="overflow-hidden rounded-lg border border-rule">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-surface font-mono text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Equipe</th>
              <th className="px-4 py-3">Condição de desbloqueio</th>
            </tr>
          </thead>
          <tbody>
            {ligas.map((liga) => (
              <tr key={liga.id} className="border-t border-rule">
                <td className="px-4 py-3 font-medium text-ink">{liga.nome}</td>
                <td className="px-4 py-3">
                  <BadgePill cor={liga.tipo === "EXCLUSIVA" ? "amber" : "trail"}>{liga.tipo}</BadgePill>
                </td>
                <td className="px-4 py-3 text-ink-soft">{liga.equipe?.nome ?? "Todas"}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                  {liga.condicaoDesbloqueio ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CriarLigaForm equipes={equipes} />
    </div>
  );
}
