import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo, moduloFoiRealizado } from "@/lib/content";
import { processarConquistasDoModulo } from "@/lib/conquistas";

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

  let modulo;
  try {
    modulo = carregarModulo(trilha, moduloId);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado no conteúdo." }, { status: 404 });
  }

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

  await prisma.progressoModulo.upsert({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
    update: { concluido: true, concluidoEm: new Date() },
    create: {
      usuarioId: sessao.usuarioId,
      moduloId,
      trilha,
      concluido: true,
      concluidoEm: new Date(),
    },
  });

  const conquistas = await processarConquistasDoModulo(sessao.usuarioId, trilha, moduloId);

  return NextResponse.json({ ok: true, ...conquistas });
}
