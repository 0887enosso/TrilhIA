import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterUsuariosParaAdmin } from "@/lib/admin";

// A rota já está protegida por src/middleware.ts (bloqueia /api/admin/* para
// quem não é ADMIN), mas repete a checagem aqui como segunda camada de
// defesa — se o middleware algum dia for reconfigurado por engano, esta
// rota continua segura por conta própria.
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao || sessao.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const usuarios = await obterUsuariosParaAdmin();
  return NextResponse.json({ usuarios });
}
