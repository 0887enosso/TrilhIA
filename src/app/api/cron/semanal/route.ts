import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { semanaIsoAnterior } from "@/lib/ligas";

/**
 * Rotina semanal, acionada pelo Vercel Cron (ver vercel.json — roda toda
 * segunda-feira). Faz duas coisas:
 *
 * 1. Apura o ranking de cada liga para a semana que acabou de terminar,
 *    preenchendo posicaoFinal em cada ParticipacaoLiga. Como cada equipe
 *    tem hoje uma única liga (sem escalões tipo bronze/prata/ouro), não há
 *    promoção/rebaixamento a calcular — só a posição final da semana.
 * 2. Repõe 1 streak freeze para todo usuário com menos de 2 disponíveis
 *    (teto de 2, conforme docs/gamificacao.md).
 *
 * Protegida por CRON_SECRET: a Vercel envia esse valor automaticamente no
 * header Authorization quando a variável de ambiente CRON_SECRET está
 * configurada no projeto (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
 */
export async function GET(request: NextRequest) {
  const segredoEsperado = process.env.CRON_SECRET;
  const segredoRecebido = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const semanaApurada = semanaIsoAnterior();

  const ligas = await prisma.liga.findMany();
  let ligasComParticipantes = 0;

  for (const liga of ligas) {
    const participacoes = await prisma.participacaoLiga.findMany({
      where: { ligaId: liga.id, semana: semanaApurada },
      orderBy: { xpNaSemana: "desc" },
    });

    for (let i = 0; i < participacoes.length; i++) {
      await prisma.participacaoLiga.update({
        where: { id: participacoes[i].id },
        data: { posicaoFinal: i + 1 },
      });
    }

    if (participacoes.length > 0) ligasComParticipantes++;
  }

  // updateMany com filtro "lt: 2" garante que ninguém passe do teto: quem
  // está em 0 ou 1 sobe para 1 ou 2; quem já está em 2 nem entra no filtro.
  const { count: usuariosComFreezeReposto } = await prisma.usuario.updateMany({
    where: { streakFreezesDisponiveis: { lt: 2 } },
    data: { streakFreezesDisponiveis: { increment: 1 } },
  });

  return NextResponse.json({
    ok: true,
    semanaApurada,
    totalLigas: ligas.length,
    ligasComParticipantes,
    usuariosComFreezeReposto,
  });
}
