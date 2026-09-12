import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { obterConteudoModuloParaCliente, TrilhaId } from "@/lib/content";

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

  try {
    const resultado = await obterConteudoModuloParaCliente(sessao.usuarioId, trilha as TrilhaId, moduloId);
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ erro: "Módulo não encontrado." }, { status: 404 });
  }
}
