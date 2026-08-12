import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { TrocarSenhaForm } from "@/components/auth/TrocarSenhaForm";

export default async function TrocarSenhaPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  return <TrocarSenhaForm />;
}
