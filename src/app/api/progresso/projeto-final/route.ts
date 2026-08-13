import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo } from "@/lib/content";
import { AcessoModuloBloqueadoError, garantirAcessoAoModulo } from "@/lib/acessoModulo";

const MODULO_ID = "intermediaria-30";
const TRILHA = "intermediaria";

const schema = z.object({
  casoId: z.string().min(1),
  respostasTarefas: z.array(z.string()),
  checklistMarcado: z.array(z.boolean()),
});

/**
 * Captura a entrega do projeto prático final — o módulo mais importante
 * pedagogicamente da trilha, e até esta correção o único que não guardava
 * nada do que o usuário produzia (ver docs/auditoria-tecnica-backend.md,
 * item #4). Precisa existir uma entrega válida aqui antes que
 * POST /api/progresso/modulo/concluir aceite marcar este módulo como
 * concluído.
 */
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "casoId, respostasTarefas e checklistMarcado são obrigatórios." },
      { status: 400 }
    );
  }
  const { casoId, respostasTarefas, checklistMarcado } = parsed.data;

  try {
    await garantirAcessoAoModulo(sessao.usuarioId, TRILHA, MODULO_ID);
  } catch (erro) {
    if (erro instanceof AcessoModuloBloqueadoError) {
      return NextResponse.json({ erro: erro.message, codigo: erro.codigo }, { status: 403 });
    }
    throw erro;
  }

  const modulo = carregarModulo(TRILHA, MODULO_ID);

  const caso = modulo.casos?.find((c: any) => c.caso_id === casoId);
  if (!caso) {
    return NextResponse.json({ erro: "Caso inválido." }, { status: 400 });
  }
  if (respostasTarefas.length !== caso.tarefas.length) {
    return NextResponse.json(
      { erro: `Este caso tem ${caso.tarefas.length} tarefas — envie uma resposta para cada uma.` },
      { status: 400 }
    );
  }
  if (checklistMarcado.length !== modulo.checklist_autoavaliacao.length) {
    return NextResponse.json(
      { erro: `O checklist tem ${modulo.checklist_autoavaliacao.length} itens.` },
      { status: 400 }
    );
  }

  const entrega = await prisma.entregaProjetoFinal.upsert({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId: MODULO_ID } },
    update: { casoId, respostasTarefas, checklistMarcado },
    create: {
      usuarioId: sessao.usuarioId,
      moduloId: MODULO_ID,
      casoId,
      respostasTarefas,
      checklistMarcado,
    },
  });

  return NextResponse.json({
    ok: true,
    entrega: { id: entrega.id, casoId: entrega.casoId, criadoEm: entrega.criadoEm },
    aviso: "Entrega registrada. Chame /api/progresso/modulo/concluir para finalizar o módulo.",
  });
}
