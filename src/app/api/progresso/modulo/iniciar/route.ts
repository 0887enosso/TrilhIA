import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { carregarModulo } from "@/lib/content";
import { tentarConsumirEstrelaDiaria } from "@/lib/limiteDiario";
import { aplicarRegeneracaoSeNecessario, calcularCoracoesLiberamEm } from "@/lib/coracoes";
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
    carregarModulo(trilha, moduloId);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado no conteúdo." }, { status: 404 });
  }

  // Trava central de acesso — trilha intermediária só libera com a básica
  // 100% concluída, e módulo seguinte só libera com o anterior concluído.
  // Checado aqui também (não só na página) porque esta rota pode ser chamada
  // direto, sem passar pelo frontend.
  try {
    await garantirAcessoAoModulo(sessao.usuarioId, trilha, moduloId);
  } catch (erro) {
    if (erro instanceof AcessoModuloBloqueadoError) {
      return NextResponse.json({ erro: erro.message, codigo: erro.codigo }, { status: 403 });
    }
    throw erro;
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

  // Vidas não são mais restauradas por "iniciar/reiniciar módulo" — só pela
  // regeneração automática por tempo (ver src/lib/coracoes.ts). Aqui só
  // aplicamos essa regeneração caso já tenha passado tempo suficiente, e
  // devolvemos os corações efetivos (que podem já estar no máximo).
  const usuarioAntes = await prisma.usuario.findUniqueOrThrow({
    where: { id: sessao.usuarioId },
  });
  const usuario = await aplicarRegeneracaoSeNecessario(sessao.usuarioId, usuarioAntes);

  return NextResponse.json({
    ok: true,
    coracoesAtuais: usuario.coracoesAtuais,
    coracoesLiberamEm: calcularCoracoesLiberamEm(usuario),
    modulosRestantesHoje: Math.max(0, 2 - usuario.modulosIniciadosHoje),
  });
}
