import { redirect } from "next/navigation";
import { obterSessaoAtual } from "@/lib/auth";
import { obterDesafioDeHojeParaCliente } from "@/lib/desafioDiario";
import { DesafioClient } from "@/components/quiz/DesafioClient";

export default async function DesafioDiarioPage() {
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Buscado aqui (Server Component) em vez de deixar o DesafioClient buscar
  // depois de montar no navegador — evita uma rodada de rede + verificação de
  // sessão extra, e a tela chega pronta em vez de mostrar "Carregando…"
  // primeiro. Mesmo padrão já usado por /liga e /conquistas.
  const dadosIniciais = await obterDesafioDeHojeParaCliente(sessao.usuarioId);

  return <DesafioClient dadosIniciais={dadosIniciais} />;
}
