import { notFound, redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterProgressoAgregado } from "@/lib/progresso";
import { ModuloClient } from "@/components/quiz/ModuloClient";
import type { TrilhaId } from "@/lib/content";

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ trilha: string; moduloId: string }>;
}) {
  const { trilha, moduloId } = await params;
  if (trilha !== "basica" && trilha !== "intermediaria") notFound();

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  if (trilha === "intermediaria") {
    const progresso = await obterProgressoAgregado(sessao.usuarioId);
    if (!progresso.basica.trilhaConcluida) redirect("/trilha/basica");
  }

  return <ModuloClient trilha={trilha as TrilhaId} moduloId={moduloId} />;
}
