import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterUsuariosParaAdmin } from "@/lib/admin";
import { UsuariosTable } from "@/components/admin/UsuariosTable";

export default async function AdminUsuariosPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const usuarios = await obterUsuariosParaAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Usuários</h1>
        <p className="font-variant-tabular mt-1 text-sm text-ink-soft">{usuarios.length} colaboradores</p>
      </div>
      <UsuariosTable usuariosIniciais={usuarios} meuId={sessao.usuarioId} />
    </div>
  );
}
