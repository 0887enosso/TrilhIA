import Link from "next/link";
import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Mascote pose="pensando" size={120} />
      <h1 className="font-sans text-2xl font-extrabold text-ink">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        Essa trilha não leva a lugar nenhum. Volte para o início e continue de onde parou.
      </p>
      <Link href="/inicio">
        <Botao>Voltar ao início</Botao>
      </Link>
    </div>
  );
}
