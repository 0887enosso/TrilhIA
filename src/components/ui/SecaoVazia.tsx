import { Mascote } from "@/components/mascote/Mascote";
import type { MascotePose } from "@/components/mascote/poses";

/**
 * Estado vazio de uma seção de conquistas.
 *
 * Existia como uma frase solta (`<p>` cinza) logo abaixo do título. Numa
 * conta nova isso fazia a tela inteira ser três frases curtas boiando num
 * fundo de pergaminho: não comunicava que havia algo a conquistar, só que
 * não havia nada ali. Com moldura tracejada e o mascote, o vazio vira um
 * lugar reservado — a leitura passa de "não tem nada" para "ainda não".
 */
export function SecaoVazia({
  pose = "sentado",
  children,
}: {
  pose?: MascotePose;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-rule bg-parchment-surface/60 px-6 py-10 text-center">
      <Mascote pose={pose} size={84} />
      <p className="max-w-sm text-sm text-ink-soft">{children}</p>
    </div>
  );
}
