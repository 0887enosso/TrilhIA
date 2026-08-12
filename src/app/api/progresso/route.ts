import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterProgressoAgregado } from "@/lib/progresso";

/**
 * Progresso agregado do usuário logado nas duas trilhas — status de cada
 * módulo (não_iniciado / em_andamento / concluído), na ordem do conteúdo.
 * É o que o frontend precisa para montar o mapa de trilha com checkmarks
 * (ver docs/auditoria-tecnica-backend.md, item #3.3).
 */
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const trilhas = await obterProgressoAgregado(sessao.usuarioId);
  return NextResponse.json({ trilhas });
}
