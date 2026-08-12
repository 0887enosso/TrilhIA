import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarSenha, criarSessao, definirCookieSessao } from "@/lib/auth";
import { dentroDoLimite, registrarTentativa } from "@/lib/rateLimiter";

const loginSchema = z.object({
  nickname: z.string().min(1),
  senha: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Nickname ou senha em formato inválido." },
      { status: 400 }
    );
  }

  const nickname = parsed.data.nickname.trim().toLowerCase();
  const { senha } = parsed.data;

  const podeTentar = await dentroDoLimite(nickname, "login");
  if (!podeTentar) {
    return NextResponse.json(
      { erro: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { nickname } });

  // Mensagem genérica de propósito: não revelar se o problema foi o
  // nickname não existir, a senha estar errada ou a conta estar desativada —
  // evita dar pista para quem está tentando enumerar contas válidas.
  const credenciaisInvalidas = async () => {
    await registrarTentativa(nickname, "login");
    return NextResponse.json({ erro: "Nickname ou senha incorretos." }, { status: 401 });
  };

  if (!usuario) {
    return credenciaisInvalidas();
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return credenciaisInvalidas();
  }

  // A partir daqui a senha já foi comprovada — dá pra ser específico sobre o
  // motivo do bloqueio sem risco de enumeração (só quem já sabe a senha vê
  // esta mensagem).
  if (!usuario.ativo) {
    return credenciaisInvalidas();
  }
  if (usuario.statusCadastro === "PENDENTE") {
    return NextResponse.json(
      {
        erro: "Seu cadastro ainda está em análise. Um administrador precisa aprovar seu acesso antes de você entrar.",
        codigo: "cadastro_pendente",
      },
      { status: 403 }
    );
  }
  if (usuario.statusCadastro === "REJEITADO") {
    return NextResponse.json(
      {
        erro: "Seu cadastro não foi aprovado. Procure um administrador para mais informações.",
        codigo: "cadastro_rejeitado",
      },
      { status: 403 }
    );
  }

  const token = await criarSessao({
    usuarioId: usuario.id,
    papel: usuario.papel,
    senhaVersao: usuario.senhaAlteradaEm.getTime(),
  });
  await definirCookieSessao(token);

  return NextResponse.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      nickname: usuario.nickname,
      papel: usuario.papel,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
    },
  });
}
