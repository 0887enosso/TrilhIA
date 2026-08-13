import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { semanaIsoAnterior, semanaIsoAtual } from "@/lib/ligas";

/**
 * Rotina semanal, acionada pelo Vercel Cron (ver vercel.json — roda toda
 * segunda-feira). Faz duas coisas:
 *
 * 1. Apura o ranking de cada liga para a semana que acabou de terminar,
 *    preenchendo posicaoFinal em cada ParticipacaoLiga. Como cada equipe
 *    tem hoje uma única liga (sem escalões tipo bronze/prata/ouro), não há
 *    promoção/rebaixamento a calcular — só a posição final da semana.
 * 2. Repõe 1 streak freeze para todo usuário com menos de 2 disponíveis
 *    (teto de 2, conforme docs/gamificacao.md), uma única vez por semana
 *    ISO (ver freezeRepostoNaSemana).
 *
 * Protegida por CRON_SECRET: a Vercel envia esse valor automaticamente no
 * header Authorization quando a variável de ambiente CRON_SECRET está
 * configurada no projeto (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
 *
 * maxDuration: 10s é o teto do plano Hobby da Vercel (não dá para pedir
 * mais nesse plano) — declarado explicitamente para documentar o limite,
 * não porque estamos pedindo mais do que ele permite.
 */
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const segredoEsperado = process.env.CRON_SECRET;
  const segredoRecebido = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const semanaApurada = semanaIsoAnterior();
  const semanaAtual = semanaIsoAtual();

  const ligas = await prisma.liga.findMany();
  let ligasComParticipantes = 0;

  for (const liga of ligas) {
    const participacoes = await prisma.participacaoLiga.findMany({
      where: { ligaId: liga.id, semana: semanaApurada },
      orderBy: [{ xpNaSemana: "desc" }, { id: "asc" }],
    });

    // Updates de uma mesma liga rodam em paralelo (Promise.all) em vez de
    // sequenciais: cada liga tem no máximo algumas dezenas de participantes
    // (ligas são por equipe do escritório), então N round-trips paralelos
    // não estressam o pool de conexões, mas eliminam o custo de latência
    // acumulada que fazia a rota estourar os 10s do plano Hobby já com ~24
    // usuários (11.911ms medidos). Descartamos $executeRaw com CASE/WHEN
    // (atualização em uma única query) por enquanto: seria mais rápido
    // ainda, mas exige montar SQL manualmente por liga, com mais risco de
    // erro do que o ganho justifica no volume atual e nos próximos meses.
    await Promise.all(
      participacoes.map((participacao, indice) =>
        prisma.participacaoLiga.update({
          where: { id: participacao.id },
          data: { posicaoFinal: indice + 1 },
        })
      )
    );

    if (participacoes.length > 0) ligasComParticipantes++;
  }

  // Reposição de freeze idempotente por semana: além do teto numérico
  // (streakFreezesDisponiveis < 2), exige que freezeRepostoNaSemana seja
  // diferente da semana ISO atual (ou nula). Sem essa segunda condição,
  // rodar o cron duas vezes na mesma semana repunha freeze duas vezes para
  // quem estivesse abaixo do teto por outro motivo (ex: acabou de gastar
  // um freeze entre as duas execuções) — medido ao vivo elevando os 24
  // usuários reais ao teto numa única sessão de teste.
  const { count: usuariosComFreezeReposto } = await prisma.usuario.updateMany({
    where: {
      streakFreezesDisponiveis: { lt: 2 },
      OR: [{ freezeRepostoNaSemana: null }, { freezeRepostoNaSemana: { not: semanaAtual } }],
    },
    data: {
      streakFreezesDisponiveis: { increment: 1 },
      freezeRepostoNaSemana: semanaAtual,
    },
  });

  return NextResponse.json({
    ok: true,
    semanaApurada,
    totalLigas: ligas.length,
    ligasComParticipantes,
    usuariosComFreezeReposto,
  });
}
