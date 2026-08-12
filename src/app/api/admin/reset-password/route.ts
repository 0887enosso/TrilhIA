import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  obterSessaoAtual,
  gerarSenhaTemporaria,
  gerarHashSenha,
} from "@/lib/auth";

const resetSchema = z.object({
  usuarioId: z.string().min(1),
});

/**
 * Endpoint exclusivo de admin. Gera uma senha temporária nova para o usuário
 * indicado e marca precisaTrocarSenha = true, forçando a troca no próximo
 * login. A senha temporária é devolvida UMA ÚNICA VEZ nesta resposta — não é
 * armazenada em nenhum lugar além do hash. Cabe ao admin repassá-la ao
 * colaborador por um canal interno (não há envio de e-mail automático).
 */
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (sessao.papel !== "ADMIN") {
    return NextResponse.json(
      { erro: "Apenas administradores podem redefinir senhas de outros usuários." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "usuarioId é obrigatório." }, { status: 400 });
  }

  const usuarioAlvo = await prisma.usuario.findUnique({
    where: { id: parsed.data.usuarioId },
  });
  if (!usuarioAlvo) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  const senhaTemporaria = gerarSenhaTemporaria();
  const novoHash = await gerarHashSenha(senhaTemporaria);

  await prisma.usuario.update({
    where: { id: usuarioAlvo.id },
    data: {
      senhaHash: novoHash,
      precisaTrocarSenha: true,
      senhaAlteradaEm: new Date(), // expulsa qualquer sessão já aberta desse usuário — é o próprio propósito de um reset
    },
  });

  return NextResponse.json({
    usuario: { id: usuarioAlvo.id, nome: usuarioAlvo.nome, nickname: usuarioAlvo.nickname },
    senhaTemporaria,
    aviso:
      "Repasse esta senha ao colaborador por um canal interno. Ela não ficará visível novamente após esta resposta.",
  });
}
