import { prisma } from "@/lib/prisma";
import { CriarEquipeForm } from "@/components/admin/CriarEquipeForm";

export default async function AdminEquipesPage() {
  const equipes = await prisma.equipe.findMany({
    include: { _count: { select: { usuarios: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Equipes</h1>

      <div className="overflow-hidden rounded-lg border border-rule">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-surface font-mono text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Colaboradores</th>
            </tr>
          </thead>
          <tbody>
            {equipes.map((equipe) => (
              <tr key={equipe.id} className="border-t border-rule">
                <td className="px-4 py-3 font-medium text-ink">{equipe.nome}</td>
                <td className="font-variant-tabular px-4 py-3 text-ink-soft">{equipe._count.usuarios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CriarEquipeForm />
    </div>
  );
}
