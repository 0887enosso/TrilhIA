import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo } from "@/lib/content";
import { tentarConsumirEstrelaDiaria } from "@/lib/limiteDiario";
import { trilhaBasicaConcluida } from "@/lib/ligas";
import { obterProgressoAgregado } from "@/lib/progresso";

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
    carregarModulo(trilha, moduloId);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado no conteúdo." }, { status: 404 });
  }

  // Trilha Intermediária só libera depois da Básica 100% concluída — não é
  // escolha livre de trilha. Checado aqui também (não só na página) porque
  // esta rota pode ser chamada direto, sem passar pelo frontend.
  if (trilha === "intermediaria" && !(await trilhaBasicaConcluida(sessao.usuarioId))) {
    return NextResponse.json(
      {
        erro: "Conclua a Trilha Básica antes de começar a Trilha Intermediária.",
        codigo: "trilha_bloqueada",
      },
      { status: 403 }
    );
  }

  // Módulo seguinte só libera depois que o anterior está concluído — checado
  // aqui (não só no mapa da trilha) porque esta rota pode ser chamada direto.
  const progresso = await obterProgressoAgregado(sessao.usuarioId);
  const moduloAlvo = progresso[trilha].modulos.find((m) => m.modulo_id === moduloId);
  if (moduloAlvo && !moduloAlvo.desbloqueado) {
    return NextResponse.json(
      {
        erro: "Conclua o módulo anterior antes de acessar este.",
        codigo: "modulo_bloqueado",
      },
      { status: 403 }
    );
  }

  const jaIniciadoAntes = await prisma.progressoModulo.findUnique({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
  });

  // Reabrir um módulo já iniciado (concluído ou não) é sempre de graça — só
  // consome estrela diária um módulo genuinamente novo para o usuário.
  if (!jaIniciadoAntes) {
    const { permitido, modulosRestantesHoje } = await tentarConsumirEstrelaDiaria(sessao.usuarioId);
    if (!permitido) {
      return NextResponse.json(
        {
          erro: "Você já usou suas 2 estrelas diárias. Novos módulos liberam amanhã.",
          codigo: "limite_diario_atingido",
          modulosRestantesHoje,
        },
        { status: 403 }
      );
    }
  }

  await prisma.progressoModulo.upsert({
    where: { usuarioId_moduloId: { usuarioId: sessao.usuarioId, moduloId } },
    update: {}, // não sobrescreve conclusão já existente
    create: { usuarioId: sessao.usuarioId, moduloId, trilha, concluido: false },
  });

  const usuario = await prisma.usuario.update({
    where: { id: sessao.usuarioId },
    data: { coracoesAtuais: 5 },
  });

  return NextResponse.json({
    ok: true,
    coracoesAtuais: usuario.coracoesAtuais,
    modulosRestantesHoje: Math.max(0, 2 - usuario.modulosIniciadosHoje),
  });
}
