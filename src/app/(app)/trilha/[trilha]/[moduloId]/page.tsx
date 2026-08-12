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

  const progresso = await obterProgressoAgregado(sessao.usuarioId);

  if (trilha === "intermediaria" && !progresso.basica.trilhaConcluida) {
    redirect("/trilha/basica");
  }

  const moduloAlvo = progresso[trilha as TrilhaId].modulos.find((m) => m.modulo_id === moduloId);
  if (!moduloAlvo) notFound();
  if (!moduloAlvo.desbloqueado) redirect(`/trilha/${trilha}`);

  return <ModuloClient trilha={trilha as TrilhaId} moduloId={moduloId} />;
}
