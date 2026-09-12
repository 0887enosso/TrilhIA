import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterDesafioDeHojeParaCliente } from "@/lib/desafioDiario";

export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.json(await obterDesafioDeHojeParaCliente(sessao.usuarioId));
}
