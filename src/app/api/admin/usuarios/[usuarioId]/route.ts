import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";

const schema = z
  .object({
    papel: z.enum(["COLABORADOR", "ADMIN"]).optional(),
    ativo: z.boolean().optional(),
    contaTeste: z.boolean().optional(),
    statusCadastro: z.enum(["PENDENTE", "APROVADO", "REJEITADO"]).optional(),
  })
  .refine(
    (dados) =>
      dados.papel !== undefined ||
      dados.ativo !== undefined ||
      dados.contaTeste !== undefined ||
      dados.statusCadastro !== undefined,
    { message: "Informe ao menos um campo para atualizar (papel, ativo, contaTeste ou statusCadastro)." }
  );

/**
 * Endpoint único para as ações administrativas de ciclo de vida de usuário:
 * promover/rebaixar entre COLABORADOR e ADMIN, ativar/desativar uma conta
 * (ex: colaborador que saiu — sem apagar o histórico de progresso), e
 * aprovar/rejeitar um cadastro pendente (ver enum StatusCadastro no schema —
 * sem isso o colaborador nunca consegue logar, mesmo com credenciais certas).
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ usuarioId: string }> }
) {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const { usuarioId } = await context.params;

  if (usuarioId === sessao.usuarioId) {
    return NextResponse.json(
      { erro: "Não é possível alterar o próprio papel ou status por esta rota." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const usuarioAlvo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuarioAlvo) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: parsed.data,
  });

  return NextResponse.json({
    usuario: {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      nickname: usuarioAtualizado.nickname,
      papel: usuarioAtualizado.papel,
      ativo: usuarioAtualizado.ativo,
      contaTeste: usuarioAtualizado.contaTeste,
      statusCadastro: usuarioAtualizado.statusCadastro,
    },
  });
}
