import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterRankingSemanalDoUsuario } from "@/lib/ligas";

/**
 * Ranking da semana corrente nas ligas em que o usuário logado pontua (liga
 * padrão da equipe + ligas exclusivas já desbloqueadas). Só existia leitura
 * de ranking pelo painel admin (GET /api/admin/ligas/[ligaId]/ranking) — o
 * colaborador não tinha nenhuma rota própria para ver sua posição.
 */
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const ligas = await obterRankingSemanalDoUsuario(sessao.usuarioId);
  return NextResponse.json({ ligas });
}
