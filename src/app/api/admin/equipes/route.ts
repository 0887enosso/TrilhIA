import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da equipe."),
});

/**
 * Cria uma nova equipe e já provisiona a liga padrão dela — mesma lógica que
 * prisma/seed.ts aplica às 3 equipes iniciais, agora disponível pelo painel
 * sem precisar mexer no banco diretamente.
 */
export async function POST(request: NextRequest) {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const existente = await prisma.equipe.findUnique({ where: { nome: parsed.data.nome } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe uma equipe com esse nome." }, { status: 409 });
  }

  const equipe = await prisma.equipe.create({ data: { nome: parsed.data.nome } });

  const liga = await prisma.liga.create({
    data: { nome: `Liga ${equipe.nome}`, tipo: "PADRAO", equipeId: equipe.id },
  });

  return NextResponse.json({ equipe, liga }, { status: 201 });
}

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const equipes = await prisma.equipe.findMany({
    include: { _count: { select: { usuarios: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ equipes });
}
