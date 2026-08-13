import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo, sanitizarQuestaoParaCliente, TrilhaId } from "@/lib/content";

export async function GET(
  _request: Request,
  context: { params: Promise<{ trilha: string; moduloId: string }> }
) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { trilha, moduloId } = await context.params;
  if (trilha !== "basica" && trilha !== "intermediaria") {
    return NextResponse.json({ erro: "Trilha inválida." }, { status: 400 });
  }

  // Só libera o conteúdo se o módulo já foi iniciado — iniciar é o que
  // consome a estrela diária (ou é de graça, se já iniciado antes). Sem essa
  // checagem, dava pra ler qualquer módulo sem gastar estrela nenhuma.
  const progresso = await prisma.progressoModulo.findUnique({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
  });
  if (!progresso) {
    return NextResponse.json(
      { erro: "Inicie o módulo antes de acessar o conteúdo.", codigo: "modulo_nao_iniciado" },
      { status: 403 }
    );
  }

  let modulo;
  try {
    modulo = carregarModulo(trilha as TrilhaId, moduloId);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado." }, { status: 404 });
  }

  // Módulo 30 (projeto prático) não tem gabarito de quiz para vazar — os
  // "casos" são o próprio enunciado do exercício, seguro devolver como está.
  if (modulo.tipo_modulo === "projeto_pratico") {
    return NextResponse.json({ modulo });
  }

  // Questões já respondidas certo antes (XpConcedido só existe quando a
  // questão foi acertada na primeira vez — ver schema.prisma) são o sinal
  // usado pelo frontend para "retomar de onde parou" em vez de recomeçar o
  // módulo do zero (ver ModuloClient.tsx).
  const todosOsIdsDeQuestao = [
    ...modulo.aulas.map((aula: any) => aula.atividade.id),
    ...modulo.atividade_final.map((questao: any) => questao.id),
  ];
  const xpConcedidos = await prisma.xpConcedido.findMany({
    where: { usuarioId: sessao.usuarioId, questaoId: { in: todosOsIdsDeQuestao } },
    select: { questaoId: true },
  });

  return NextResponse.json({
    modulo: {
      modulo_id: modulo.modulo_id,
      titulo: modulo.titulo,
      descricao_curta: modulo.descricao_curta,
      tempo_estimado_min: modulo.tempo_estimado_min,
      objetivos_aprendizagem: modulo.objetivos_aprendizagem,
      aulas: modulo.aulas.map((aula: any) => ({
        ordem: aula.ordem,
        titulo_aula: aula.titulo_aula,
        corpo: aula.corpo,
        destaque: aula.destaque,
        atividade: sanitizarQuestaoParaCliente(aula.atividade),
      })),
      atividade_final: modulo.atividade_final.map(sanitizarQuestaoParaCliente),
      questoesRespondidasCorretamente: xpConcedidos.map((x) => x.questaoId),
    },
  });
}
