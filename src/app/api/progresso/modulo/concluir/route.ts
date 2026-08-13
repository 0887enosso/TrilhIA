import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo, moduloFoiRealizado } from "@/lib/content";
import { processarConquistasDoModulo } from "@/lib/conquistas";
import { AcessoModuloBloqueadoError, garantirAcessoAoModulo } from "@/lib/acessoModulo";

const schema = z.object({
  trilha: z.enum(["basica", "intermediaria"]),
  moduloId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "trilha e moduloId são obrigatórios." }, { status: 400 });
  }
  const { trilha, moduloId } = parsed.data;

  try {
    await garantirAcessoAoModulo(sessao.usuarioId, trilha, moduloId);
  } catch (erro) {
    if (erro instanceof AcessoModuloBloqueadoError) {
      return NextResponse.json({ erro: erro.message, codigo: erro.codigo }, { status: 403 });
    }
    throw erro;
  }

  let modulo;
  try {
    modulo = carregarModulo(trilha, moduloId);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado no conteúdo." }, { status: 404 });
  }

  // Se o módulo já está concluído, esta é uma re-tentativa (idempotente) —
  // pula direto para conceder conquistas, sem re-exigir as questões
  // respondidas ou a entrega do projeto final. Isso também serve de
  // "auto-cura": se uma conclusão anterior tiver marcado o módulo como
  // concluído mas caído antes de conceder badge/certificado (falha entre as
  // duas operações), chamar esta rota de novo completa o que faltou —
  // `concederBadge`/`emitirCertificado` usam upsert por chave única, então
  // não duplicam nada já concedido.
  const registroExistente = await prisma.progressoModulo.findUnique({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
  });
  const jaConcluido = registroExistente?.concluido ?? false;

  if (!jaConcluido) {
    // Módulo 30 (projeto prático) não tem quiz — sua conclusão exige uma
    // entrega registrada em POST /api/progresso/projeto-final (caso escolhido,
    // tarefas respondidas, checklist). Para todos os demais, exige que cada
    // questão tenha sido respondida (corretamente, ou ao menos uma vez no caso
    // autoavaliado) antes de permitir marcar como concluído. Em ambos os
    // casos, o objetivo é o mesmo: sem essa checagem, uma chamada direta à API
    // concedia badge e certificado sem nenhum esforço real.
    if (modulo.tipo_modulo === "projeto_pratico") {
      const entrega = await prisma.entregaProjetoFinal.findUnique({
        where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
      });
      if (!entrega) {
        return NextResponse.json(
          {
            erro: "Registre sua entrega em /api/progresso/projeto-final antes de concluir este módulo.",
            codigo: "entrega_nao_registrada",
          },
          { status: 409 }
        );
      }
    } else {
      const realizado = await moduloFoiRealizado(sessao.usuarioId, trilha, moduloId);
      if (!realizado) {
        return NextResponse.json(
          {
            erro: "Ainda faltam questões para concluir este módulo.",
            codigo: "modulo_incompleto",
          },
          { status: 409 }
        );
      }
    }
  }

  // Upsert de conclusão e concessão de badge/certificado acontecem na mesma
  // transação — sem isso, uma queda do processo entre as duas operações
  // deixava o módulo concluído sem nunca conceder a conquista, sem forma de
  // recuperação (a rota não era chamável de novo porque a re-checagem de
  // questões respondidas bloqueava a re-tentativa).
  const conquistas = await prisma.$transaction(async (tx) => {
    await tx.progressoModulo.upsert({
      where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
      // Se já estava concluído, não sobrescreve concluidoEm numa re-tentativa.
      update: jaConcluido ? {} : { concluido: true, concluidoEm: new Date() },
      create: {
        usuarioId: sessao.usuarioId,
        moduloId,
        trilha,
        concluido: true,
        concluidoEm: new Date(),
      },
    });

    return processarConquistasDoModulo(sessao.usuarioId, trilha, moduloId, tx);
  });

  return NextResponse.json({ ok: true, ...conquistas });
}
