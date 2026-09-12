import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterRankingAdminDaLiga } from "@/lib/ligas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ligaId: string }> }
) {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const { ligaId } = await context.params;
  const resultado = await obterRankingAdminDaLiga(ligaId);
  if (!resultado) {
    return NextResponse.json({ erro: "Liga não encontrada." }, { status: 404 });
  }

  return NextResponse.json(resultado);
}
