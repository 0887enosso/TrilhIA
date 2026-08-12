import { NextResponse } from "next/server";
import { obterSessaoAtual } from "@/lib/auth";
import { obterConquistasDoUsuario } from "@/lib/conquistas";

/**
 * Badges e certificados do usuário logado. ConquistaUsuario e Certificado já
 * eram gravados por src/lib/conquistas.ts ao concluir módulo, mas até esta
 * rota não existia nenhum jeito de o frontend ler essas listas (ver
 * docs/auditoria-tecnica-backend.md, item #3.2).
 */
export async function GET() {
  const sessao = await obterSessaoAtual();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const { badges, certificados } = await obterConquistasDoUsuario(sessao.usuarioId);
  return NextResponse.json({ badges, certificados });
}
