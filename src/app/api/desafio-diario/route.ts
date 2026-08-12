import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { obterOuCriarDesafioDeHoje } from "@/lib/desafioDiario";
import { buscarQuestao, sanitizarQuestaoParaCliente, parseQuestaoId } from "@/lib/content";

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const desafio = await obterOuCriarDesafioDeHoje(sessao.usuarioId);

  if (!desafio) {
    return NextResponse.json({
      desafio: null,
      aviso: "Inicie pelo menos um módulo para desbloquear o desafio diário.",
    });
  }

  const inicioDoDia = new Date(
    Date.UTC(desafio.data.getUTCFullYear(), desafio.data.getUTCMonth(), desafio.data.getUTCDate())
  );

  const respondidasHoje = await prisma.respostaQuestao.findMany({
    where: {
      usuarioId: sessao.usuarioId,
      questaoId: { in: desafio.questaoIds },
      respondidoEm: { gte: inicioDoDia },
    },
    select: { questaoId: true },
    distinct: ["questaoId"],
  });
  const idsRespondidos = new Set(respondidasHoje.map((r) => r.questaoId));

  const questoes = desafio.questaoIds.map((questaoId) => {
    const { trilha, moduloId } = parseQuestaoId(questaoId);
    const questao = buscarQuestao(trilha, moduloId, questaoId);
    return {
      trilha,
      moduloId,
      jaRespondidaHoje: idsRespondidos.has(questaoId),
      questao: sanitizarQuestaoParaCliente(questao),
    };
  });

  return NextResponse.json({
    desafio: {
      concluido: desafio.concluido,
      xpBonusConcedido: desafio.xpBonusConcedido,
      questoes,
    },
  });
}
