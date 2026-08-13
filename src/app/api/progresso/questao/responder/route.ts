import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { buscarQuestao, validarResposta, extrairExplicacao } from "@/lib/content";
import { xpPorTipoQuestao, calcularNivel } from "@/lib/xp";
import { adicionarXpSemanal } from "@/lib/ligas";
import { processarRespostaParaDesafioDiario } from "@/lib/desafioDiario";
import { aplicarRegeneracaoSeNecessario, calcularCoracoesLiberamEm } from "@/lib/coracoes";
import { AcessoModuloBloqueadoError, garantirAcessoAoModulo } from "@/lib/acessoModulo";

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

  // Mesma trava usada em iniciar/concluir/projeto-final: sem isso, dava para
  // responder (e ganhar XP de) uma questão de um módulo bloqueado chamando
  // esta rota direto, ignorando a UI.
  try {
    await garantirAcessoAoModulo(sessao.usuarioId, trilha, moduloId);
  } catch (erro) {
    if (erro instanceof AcessoModuloBloqueadoError) {
      return NextResponse.json({ erro: erro.message, codigo: erro.codigo }, { status: 403 });
    }
    throw erro;
  }

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

  await prisma.respostaQuestao.create({
    data: {
      usuarioId: sessao.usuarioId,
      questaoId,
      moduloId,
      tipoQuestao: questao.tipo,
      correta,
      tentativas: tentativasAnteriores + 1,
    },
  });

  // --- Desafio diário: decide e persiste a conclusão em si (se for o caso),
  // mas não grava xpTotal/nivel/liga — isso é feito uma única vez abaixo,
  // somado ao XP da questão, para não duplicar a mesma escrita de usuário
  // nem refazer a checagem de elegibilidade de liga duas vezes na mesma
  // requisição. O foguinho de engajamento só avança aqui dentro, quando o
  // desafio do dia é concluído — ver src/lib/desafioDiario.ts.
  const resultadoDesafioDiario = await processarRespostaParaDesafioDiario(
    sessao.usuarioId,
    questaoId,
    {
      ultimoDesafioDiarioConcluidoEm: usuarioAntes.ultimoDesafioDiarioConcluidoEm,
      streakFreezesDisponiveis: usuarioAntes.streakFreezesDisponiveis,
    }
  );
  const xpBonusDesafio = resultadoDesafioDiario?.xpBonus ?? 0;
  const deveTentarConcederXp = ehAutoavaliada ? true : correta === true;
  const valorXpQuestao = deveTentarConcederXp ? xpPorTipoQuestao(questao.tipo) : 0;

  // --- XP: concessão do XP da questão (dedup via constraint única em
  // XpConcedido), soma ao xpTotal/nivel do usuário e distribuição na liga
  // semanal andam todos na mesma transação — sem isso, uma queda do processo
  // entre gravar o XpConcedido e somar ao xpTotal (ou entre isso e somar na
  // liga) perdia XP do usuário (ou da liga) silenciosamente, sem forma de
  // recuperação (a constraint única em XpConcedido impede reconceder depois).
  let xpGanho = 0;
  await prisma.$transaction(async (tx) => {
    if (deveTentarConcederXp) {
      try {
        await tx.xpConcedido.create({
          data: { usuarioId: sessao.usuarioId, questaoId, xp: valorXpQuestao },
        });
        xpGanho = valorXpQuestao; // só chega aqui se a criação teve sucesso — 1ª vez de verdade
      } catch (erro) {
        const jaConcedidoAntes =
          erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
        if (!jaConcedidoAntes) throw erro;
        // já existia: outra resposta (desta ou de outra requisição concorrente)
        // já concedeu XP por essa questão — não concede de novo.
      }
    }

    const xpTotalGanhoNaRequisicao = xpGanho + xpBonusDesafio;
    if (xpTotalGanhoNaRequisicao <= 0) return;

    // increment atômico no banco (não "ler xpTotal, somar em código, gravar")
    // — combinar isso numa leitura-cálculo-escrita reabriria uma corrida de
    // perda de XP se duas respostas do mesmo usuário chegarem quase juntas.
    const comXpAtualizado = await tx.usuario.update({
      where: { id: sessao.usuarioId },
      data: { xpTotal: { increment: xpTotalGanhoNaRequisicao } },
    });
    await tx.usuario.update({
      where: { id: sessao.usuarioId },
      data: { nivel: calcularNivel(comXpAtualizado.xpTotal) },
    });
    await adicionarXpSemanal(
      sessao.usuarioId,
      usuarioAntes.equipeId,
      xpTotalGanhoNaRequisicao,
      usuarioAntes.contaTeste,
      tx
    );
  });

  // --- Corações: decremento condicional (gt: 0), nunca fica negativo mesmo
  // sob concorrência — diferente de um decrement simples, que não tem piso.
  if (!ehAutoavaliada && correta === false) {
    const resultado = await prisma.usuario.updateMany({
      where: { id: sessao.usuarioId, coracoesAtuais: { gt: 0 } },
      data: { coracoesAtuais: { decrement: 1 } },
    });
    if (resultado.count > 0) {
      const usuarioComCoracaoDecrementado = await prisma.usuario.findUniqueOrThrow({
        where: { id: sessao.usuarioId },
      });
      // Corações chegaram a exatamente zero agora: grava o timestamp que
      // dispara a regeneração automática em 2h (ver src/lib/coracoes.ts). Só
      // sabemos que chegou a zero depois de ler o valor pós-decremento acima,
      // por isso essa escrita extra só acontece nesse caso específico (não
      // em toda resposta errada).
      if (usuarioComCoracaoDecrementado.coracoesAtuais === 0) {
        await prisma.usuario.update({
          where: { id: sessao.usuarioId },
          data: { coracoesZeradosEm: new Date() },
        });
      }
    }
  }

  // Relida sempre no fim, mesmo quando nada acima "venceu" a própria escrita
  // (ex: resultado.count === 0 porque outra requisição concorrente já tinha
  // decrementado o coração; ou quando só a transação de XP escreveu). Sem
  // isso, a resposta podia devolver coracoesAtuais/xpTotal desatualizados
  // mesmo com o banco já refletindo o valor certo.
  const usuarioAtualizado = await prisma.usuario.findUniqueOrThrow({
    where: { id: sessao.usuarioId },
  });

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
