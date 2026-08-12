import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterResumoUsuario } from "@/lib/usuario";

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ usuario: null });
  }

  const usuario = await obterResumoUsuario(sessao.usuarioId);
  return NextResponse.json({ usuario });
}
