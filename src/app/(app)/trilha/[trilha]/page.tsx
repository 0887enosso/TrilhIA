import { notFound, redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterProgressoAgregado } from "@/lib/progresso";
import { MapaTrilha } from "@/components/trilha/MapaTrilha";
import type { TrilhaId } from "@/lib/content";

const TITULO: Record<TrilhaId, string> = {
  basica: "Trilha Básica",
  intermediaria: "Trilha Intermediária",
};

export default async function TrilhaPage({
  params,
}: {
  params: Promise<{ trilha: string }>;
}) {
  const { trilha } = await params;
  if (trilha !== "basica" && trilha !== "intermediaria") notFound();

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const progresso = await obterProgressoAgregado(sessao.usuarioId);

  // Trilha Intermediária só libera depois da Básica 100% concluída — sem
  // escolha livre de trilha (ver também o mesmo guard em
  // POST /api/progresso/modulo/iniciar, que bloqueia mesmo por chamada direta).
  if (trilha === "intermediaria" && !progresso.basica.trilhaConcluida) {
    redirect("/trilha/basica");
  }

  const dados = progresso[trilha as TrilhaId];
  const percentual = Math.round((dados.concluidos / dados.totalModulos) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border-2 border-rule bg-parchment-surface p-6">
        <h1 className="font-sans text-2xl font-extrabold text-ink">{TITULO[trilha as TrilhaId]}</h1>
        <p className="font-variant-tabular mt-1 text-sm font-bold text-trail-strong">
          {dados.concluidos} de {dados.totalModulos} módulos concluídos
        </p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-rule">
          <div
            className="h-full rounded-full bg-trail transition-[width] duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>

      <MapaTrilha trilha={trilha as TrilhaId} modulos={dados.modulos} />
    </div>
  );
}
