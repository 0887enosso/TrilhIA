import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual, gerarHashSenha, criarSessao, definirCookieSessao } from "@/lib/auth";

const trocarSenhaSchema = z.object({
  novaSenha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
});

export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = trocarSenhaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Senha inválida." },
      { status: 400 }
    );
  }

  const novoHash = await gerarHashSenha(parsed.data.novaSenha);
  const novaSenhaAlteradaEm = new Date();

  const usuario = await prisma.usuario.update({
    where: { id: sessao.usuarioId },
    data: {
      senhaHash: novoHash,
      precisaTrocarSenha: false,
      senhaAlteradaEm: novaSenhaAlteradaEm, // invalida qualquer OUTRA sessão aberta com a senha antiga
    },
  });

  // Reemite a sessão atual com a nova versão de senha — sem isso, o próprio
  // usuário seria deslogado pela ação que ele mesmo acabou de fazer.
  const novoToken = await criarSessao({
    usuarioId: usuario.id,
    papel: usuario.papel,
    senhaVersao: novaSenhaAlteradaEm.getTime(),
  });
  await definirCookieSessao(novoToken);

  return NextResponse.json({ ok: true });
}
