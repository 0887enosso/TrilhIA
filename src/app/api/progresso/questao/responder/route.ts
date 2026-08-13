import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { buscarQuestao, validarResposta, extrairExplicacao } from "@/lib/content";
import { xpPorTipoQuestao, calcularNivel } from "@/lib/xp";
import { adicionarXpSemanal } from "@/lib/ligas";
import { atualizarStreak } from "@/lib/streak";
import { processarRespostaParaDesafioDiario } from "@/lib/desafioDiario";
import { aplicarRegeneracaoSeNecessario, calcularCoracoesLiberamEm } from "@/lib/coracoes";

const schema = z.object({
  trilha: z.enum(["basica", "intermediaria"]),
  moduloId: z.string().min(1),
  questaoId: z.string().min(1),
  resposta: z.any(), // formato varia por tipo de questão, validado em src/lib/content.ts
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "trilha, moduloId, questaoId e resposta são obrigatórios." },
      { status: 400 }
    );
  }
  const { trilha, moduloId, questaoId, resposta } = parsed.data;

  let questao;
  try {
    questao = buscarQuestao(trilha, moduloId, questaoId);
  } catch {
    return NextResponse.json({ erro: "Questão não encontrada no conteúdo." }, { status: 404 });
  }

  const ehAutoavaliada = questao.tipo === "resposta_curta_autoavaliada";

  const usuarioCarregado = await prisma.usuario.findUniqueOrThrow({
    where: { id: sessao.usuarioId },
  });
  // Antes de checar corações: se já passaram as 2h de regeneração desde que
  // zeraram, isso libera a pergunta mesmo que o registro ainda não tivesse
  // sido tocado por nenhuma outra rota (ex: usuário nunca reabriu a rota de
  // iniciar módulo nem recarregou o resumo — ainda assim a regeneração vale).
  const usuarioAntes = await aplicarRegeneracaoSeNecessario(sessao.usuarioId, usuarioCarregado);

  if (!ehAutoavaliada && usuarioAntes.coracoesAtuais <= 0) {
    return NextResponse.json(
      {
        erro: "Sem corações disponíveis. Eles voltam sozinhos em até 2 horas.",
        codigo: "sem_coracoes",
        coracoesLiberamEm: calcularCoracoesLiberamEm(usuarioAntes),
      },
      { status: 403 }
    );
  }

  const correta = validarResposta(questao, resposta);

  const tentativasAnteriores = await prisma.respostaQuestao.count({
    where: { usuarioId: sessao.usuarioId, questaoId },
  });

  // --- Independentes entre si: gravar a tentativa e atualizar o streak não
  // dependem um do outro, então rodam em paralelo em vez de em série.
  await Promise.all([
    prisma.respostaQuestao.create({
      data: {
        usuarioId: sessao.usuarioId,
        questaoId,
        moduloId,
        tipoQuestao: questao.tipo,
        correta,
        tentativas: tentativasAnteriores + 1,
      },
    }),
    atualizarStreak(sessao.usuarioId, {
      ultimoDiaAtivo: usuarioAntes.ultimoDiaAtivo,
      streakFreezesDisponiveis: usuarioAntes.streakFreezesDisponiveis,
    }),
  ]);

  // --- XP: concedido no máximo uma vez por questão, mesmo sob concorrência.
  // A constraint única em XpConcedido é quem garante isso — a criação abaixo
  // só "vence" para uma requisição, mesmo que duas cheguem juntas para a
  // mesma questão (ex: clique duplo, duas abas abertas).
  let xpGanho = 0;
  const deveTentarConcederXp = ehAutoavaliada ? true : correta === true;

  if (deveTentarConcederXp) {
    const valor = xpPorTipoQuestao(questao.tipo);
    try {
      await prisma.xpConcedido.create({
        data: { usuarioId: sessao.usuarioId, questaoId, xp: valor },
      });
      xpGanho = valor; // só chega aqui se a criação teve sucesso — 1ª vez de verdade
    } catch (erro) {
      const jaConcedidoAntes =
        erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
      if (!jaConcedidoAntes) throw erro;
      // já existia: outra resposta (desta ou de outra requisição concorrente)
      // já concedeu XP por essa questão — não concede de novo.
    }
  }

  let usuarioAtualizado = usuarioAntes;

  // --- Desafio diário: decide e persiste a conclusão em si (se for o caso),
  // mas não grava xpTotal/nivel/liga — isso é feito uma única vez abaixo,
  // somado ao XP da questão, para não duplicar a mesma escrita de usuário
  // nem refazer a checagem de elegibilidade de liga duas vezes na mesma
  // requisição.
  const resultadoDesafioDiario = await processarRespostaParaDesafioDiario(
    sessao.usuarioId,
    questaoId
  );
  const xpBonusDesafio = resultadoDesafioDiario?.xpBonus ?? 0;
  const xpTotalGanhoNaRequisicao = xpGanho + xpBonusDesafio;

  if (xpTotalGanhoNaRequisicao > 0) {
    // increment atômico no banco (não "ler xpTotal, somar em código, gravar")
    // — combinar isso numa leitura-cálculo-escrita reabriria uma corrida de
    // perda de XP se duas respostas do mesmo usuário chegarem quase juntas.
    const comXpAtualizado = await prisma.usuario.update({
      where: { id: sessao.usuarioId },
      data: { xpTotal: { increment: xpTotalGanhoNaRequisicao } },
    });
    usuarioAtualizado = await prisma.usuario.update({
      where: { id: sessao.usuarioId },
      data: { nivel: calcularNivel(comXpAtualizado.xpTotal) },
    });
    await adicionarXpSemanal(sessao.usuarioId, usuarioAntes.equipeId, xpTotalGanhoNaRequisicao);
  }

  // --- Corações: decremento condicional (gt: 0), nunca fica negativo mesmo
  // sob concorrência — diferente de um decrement simples, que não tem piso.
  if (!ehAutoavaliada && correta === false) {
    const resultado = await prisma.usuario.updateMany({
      where: { id: sessao.usuarioId, coracoesAtuais: { gt: 0 } },
      data: { coracoesAtuais: { decrement: 1 } },
    });
    if (resultado.count > 0) {
      usuarioAtualizado = await prisma.usuario.findUniqueOrThrow({
        where: { id: sessao.usuarioId },
      });
      // Corações chegaram a exatamente zero agora: grava o timestamp que
      // dispara a regeneração automática em 2h (ver src/lib/coracoes.ts). Só
      // sabemos que chegou a zero depois de ler o valor pós-decremento acima,
      // por isso essa escrita extra só acontece nesse caso específico (não
      // em toda resposta errada).
      if (usuarioAtualizado.coracoesAtuais === 0) {
        usuarioAtualizado = await prisma.usuario.update({
          where: { id: sessao.usuarioId },
          data: { coracoesZeradosEm: new Date() },
        });
      }
    }
  }

  return NextResponse.json({
    correta,
    xpGanho,
    coracoesAtuais: usuarioAtualizado.coracoesAtuais,
    xpTotal: usuarioAtualizado.xpTotal,
    nivel: usuarioAtualizado.nivel,
    explicacao: extrairExplicacao(questao, correta),
    desafioDiario: resultadoDesafioDiario,
  });
}
