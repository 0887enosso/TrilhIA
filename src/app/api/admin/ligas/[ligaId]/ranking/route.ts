import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { semanaIsoAtual } from "@/lib/ligas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ligaId: string }> }
) {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const { ligaId } = await context.params;

  const liga = await prisma.liga.findUnique({ where: { id: ligaId } });
  if (!liga) {
    return NextResponse.json({ erro: "Liga não encontrada." }, { status: 404 });
  }

  const semana = semanaIsoAtual();

  const participacoes = await prisma.participacaoLiga.findMany({
    where: { ligaId, semana },
    include: { usuario: { select: { nome: true, equipe: { select: { nome: true } } } } },
    orderBy: { xpNaSemana: "desc" },
  });

  return NextResponse.json({
    liga: { id: liga.id, nome: liga.nome, tipo: liga.tipo },
    semana,
    ranking: participacoes.map((p, i) => ({
      posicao: i + 1,
      usuario: p.usuario.nome,
      equipe: p.usuario.equipe.nome,
      xpNaSemana: p.xpNaSemana,
    })),
  });
}
