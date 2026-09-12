"use client";

import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";
import { IconeXp } from "@/components/ui/iconesJogo";
import type { ReactNode } from "react";

type BarraFeedbackProps = {
  estado: "acerto" | "erro" | "registrado";
  xpGanho?: number;
  titulo: string;
  children?: ReactNode;
  rotuloAcao: string;
  aoAgir: () => void;
};

/**
 * Barra de resultado fixa no rodapé, no lugar da caixinha colorida que
 * aparecia dentro do cartão da questão.
 *
 * O motivo é de ritmo, não de enfeite: com o resultado inline, o botão de
 * continuar nascia num lugar diferente a cada questão (dependia do tamanho
 * do enunciado e da explicação), então o usuário precisava procurar onde
 * clicar a cada rodada. Fixa no rodapé, a ação fica sempre no mesmo pixel —
 * é o que permite encadear várias questões sem tirar a mão do lugar, que é
 * a mecânica que o app copia do Duolingo.
 *
 * `left-20` acompanha a largura da sidebar recolhida (ver AppShell/Sidebar):
 * a barra é `fixed`, então não herda o padding do container de conteúdo.
 */
export function BarraFeedback({
  estado,
  xpGanho = 0,
  titulo,
  children,
  rotuloAcao,
  aoAgir,
}: BarraFeedbackProps) {
  const acerto = estado === "acerto";
  const erro = estado === "erro";

  const pose = acerto ? "comemorando" : erro ? "cansado" : "pensando";
  const fundo = acerto ? "bg-jade-soft" : erro ? "bg-coral-soft" : "bg-amber-soft";
  const borda = acerto ? "border-jade" : erro ? "border-coral" : "border-amber";
  const corTitulo = acerto ? "text-jade-strong" : erro ? "text-coral-strong" : "text-amber-strong";

  return (
    <div
      role="status"
      className={`fixed bottom-0 left-20 right-0 z-30 max-h-[52vh] overflow-y-auto border-t-4 ${borda} ${fundo} px-4 py-4 shadow-lift-lg print:hidden`}
    >
      <div className="mx-auto flex max-w-4xl items-start gap-4">
        <span className="hidden flex-none sm:block">
          <Mascote pose={pose} size={72} />
        </span>

        <div className="flex-1">
          <p className={`flex items-center gap-2 font-sans text-xl font-extrabold ${corTitulo}`}>
            {titulo}
            {acerto && xpGanho > 0 ? (
              <span className="inline-flex animate-estourar items-center gap-1 rounded-full bg-amber-soft px-2.5 py-0.5 text-sm text-amber-strong">
                <IconeXp tamanho={16} />
                <span className="font-variant-tabular">+{xpGanho} XP</span>
              </span>
            ) : null}
          </p>
          {children ? <div className="mt-1.5 text-sm text-ink">{children}</div> : null}
        </div>

        <Botao
          onClick={aoAgir}
          variante={erro ? "perigo" : "primaria"}
          tamanho="lg"
          className="flex-none self-center"
        >
          {rotuloAcao}
        </Botao>
      </div>
    </div>
  );
}
