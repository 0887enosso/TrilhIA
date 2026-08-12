import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterProgressoAgregado } from "@/lib/progresso";

/**
 * Não existe mais escolha livre de trilha na navegação — um único item
 * "Trilha" na sidebar cai aqui, que decide pra qual trilha mandar o usuário:
 * a intermediária só libera depois que a básica está 100% concluída (ver
 * também o mesmo guard em /trilha/[trilha] e em
 * POST /api/progresso/modulo/iniciar).
 */
export default async function TrilhaIndexPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const progresso = await obterProgressoAgregado(sessao.usuarioId);
  redirect(progresso.basica.trilhaConcluida ? "/trilha/intermediaria" : "/trilha/basica");
}
