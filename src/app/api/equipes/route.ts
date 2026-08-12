import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pública de propósito — o formulário de cadastro precisa listar as equipes
// antes de o usuário ter qualquer sessão.
export async function GET() {
  const equipes = await prisma.equipe.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json({ equipes });
}
