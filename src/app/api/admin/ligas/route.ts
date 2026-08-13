import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessaoAtual } from "@/lib/auth";
import { CONDICOES_DESBLOQUEIO_VALORES } from "@/lib/condicoesLiga";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da liga."),
  tipo: z.enum(["PADRAO", "EXCLUSIVA"]),
  equipeId: z.string().nullable().optional(),
  // Vazio/null = liga exclusiva sem condição (elegível pra todo mundo da
  // equipe, ou de qualquer equipe). Um valor fora da lista fica pra sempre
  // sem participante possível (ver src/lib/ligas.ts) — em vez de aceitar
  // qualquer texto, valida contra a mesma lista usada no formulário do
  // painel admin, pra pegar um erro de digitação na hora da criação.
  condicaoDesbloqueio: z
    .string()
    .nullable()
    .optional()
    .refine(
      (valor) =>
        !valor || (CONDICOES_DESBLOQUEIO_VALORES as readonly string[]).includes(valor),
      { message: "Condição de desbloqueio não reconhecida — escolha uma das opções da lista." }
    ),
});

/**
 * Permite criar ligas além das provisionadas automaticamente (liga padrão de
 * cada equipe, criada junto com a equipe — ver /api/admin/equipes). Útil
 * principalmente para novas ligas EXCLUSIVA além da já semeada (ex: uma
 * liga para quem concluir a Trilha Intermediária, quando essa condição for
 * adicionada em src/lib/ligas.ts).
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

  const { nome, tipo, equipeId, condicaoDesbloqueio } = parsed.data;

  if (equipeId) {
    const equipe = await prisma.equipe.findUnique({ where: { id: equipeId } });
    if (!equipe) {
      return NextResponse.json({ erro: "Equipe inválida." }, { status: 400 });
    }
  }

  const liga = await prisma.liga.create({
    data: {
      nome,
      tipo,
      equipeId: equipeId ?? null,
      condicaoDesbloqueio: condicaoDesbloqueio ? condicaoDesbloqueio : null,
    },
  });

  return NextResponse.json({ liga }, { status: 201 });
}

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const ligas = await prisma.liga.findMany({
    include: { equipe: { select: { nome: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ ligas });
}
