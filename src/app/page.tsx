import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";

export default async function RootPage() {
  const sessao = await obterSessaoAtual();
  redirect(sessao ? "/inicio" : "/login");
}
