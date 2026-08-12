import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterResumoUsuario } from "@/lib/usuario";
import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const usuario = await obterResumoUsuario(sessao.usuarioId);
  if (!usuario) redirect("/login");
  if (usuario.precisaTrocarSenha) redirect("/trocar-senha");

  return <AppShell usuario={usuario}>{children}</AppShell>;
}
