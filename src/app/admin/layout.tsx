import Link from "next/link";
import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { LogoutButton } from "@/components/app/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");
  if (sessao.papel !== "ADMIN") redirect("/inicio");

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-parchment-raised">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-display text-lg text-ink">TrilhIA · Painel admin</span>
          <nav className="flex flex-1 gap-1">
            <Link href="/admin/usuarios" className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-parchment">
              Usuários
            </Link>
            <Link href="/admin/equipes" className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-parchment">
              Equipes
            </Link>
            <Link href="/admin/ligas" className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-parchment">
              Ligas
            </Link>
          </nav>
          <Link href="/inicio" className="text-sm text-ink-soft hover:underline">
            Voltar ao app
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
