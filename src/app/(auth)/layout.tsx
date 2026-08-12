import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";

// Fundo é só o que já vem do layout raiz (TrilhaBackdrop + Noise) — mesmo
// efeito da tela principal, de propósito (antes o login tinha o Topography
// da React Bits por cima, o que deixava as duas telas com fundos diferentes).
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessaoAtual();
  if (sessao) redirect("/inicio");

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
