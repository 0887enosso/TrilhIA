import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { DesafioClient } from "@/components/quiz/DesafioClient";

export default async function DesafioDiarioPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  return <DesafioClient />;
}
