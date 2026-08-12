import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { gerarHashSenha } from "@/lib/auth";
import { dentroDoLimite, registrarTentativa, obterIpDaRequisicao } from "@/lib/rateLimiter";

const registerSchema = z.object({
  nome: z.string().min(2, "Informe o nome completo."),
  nickname: z
    .string()
    .min(3, "O nickname precisa ter pelo menos 3 caracteres.")
    .max(24, "O nickname pode ter no máximo 24 caracteres.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, ponto, hífen ou underline."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  equipeId: z.string().min(1, "Selecione uma equipe."),
});

/**
 * Cadastro não coleta e-mail — só nome, nickname e senha. Não loga
 * automaticamente: toda conta nasce com statusCadastro PENDENTE, e só um
 * admin aprovando (PATCH /api/admin/usuarios/[usuarioId]) libera o login de
 * verdade (ver src/app/api/auth/login/route.ts). Substitui a antiga
 * restrição por domínio de e-mail — mecanismo mais forte, já que agora nem
 * e-mail existe para restringir.
 */
export async function POST(request: NextRequest) {
  const ip = obterIpDaRequisicao(request);
  const podeTentar = await dentroDoLimite(ip, "register");
  if (!podeTentar) {
    return NextResponse.json(
      { erro: "Muitas contas criadas a partir deste endereço recentemente. Tente novamente mais tarde." },
      { status: 429 }
    );
  }
  await registrarTentativa(ip, "register");

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { nome, senha, equipeId } = parsed.data;
  const nickname = parsed.data.nickname.trim().toLowerCase();

  const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } });
  if (!equipe) {
    return NextResponse.json({ erro: "Equipe inválida." }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { nickname } });
  if (existente) {
    return NextResponse.json({ erro: "Esse nickname já está em uso." }, { status: 409 });
  }

  const senhaHash = await gerarHashSenha(senha);

  // papel é sempre COLABORADOR aqui — nunca aceito do corpo da requisição.
  // Promover alguém a ADMIN é feito por outro admin, via
  // PATCH /api/admin/usuarios/[usuarioId].
  const usuario = await prisma.usuario.create({
    data: { nome, nickname, senhaHash, equipeId, papel: "COLABORADOR", statusCadastro: "PENDENTE" },
  });

  return NextResponse.json(
    {
      usuario: { id: usuario.id, nome: usuario.nome, nickname: usuario.nickname },
      aviso: "Cadastro enviado! Um administrador precisa aprovar seu acesso antes que você possa entrar.",
    },
    { status: 201 }
  );
}
