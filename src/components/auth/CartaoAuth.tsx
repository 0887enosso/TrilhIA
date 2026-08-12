import { ReactNode } from "react";
import { Mascote } from "@/components/mascote/Mascote";
import type { MascotePose } from "@/components/mascote/poses";

type CartaoAuthProps = {
  pose: MascotePose;
  children: ReactNode;
};

/**
 * Cartão sólido usado nas telas de login/cadastro — antes o formulário
 * ficava direto sobre a textura de fundo, sem nenhum contorno ("vazado").
 * O mascote fica grande e sobrepõe a borda superior do cartão (a margem
 * negativa empurra ele por cima), como se estivesse apoiado ali, em vez de
 * flutuar solto acima do conteúdo.
 */
export function CartaoAuth({ pose, children }: CartaoAuthProps) {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="z-10 -mb-12 drop-shadow-lg">
        <Mascote pose={pose} size={180} />
      </div>
      <div className="w-full rounded-3xl border-2 border-rule bg-parchment-surface px-8 pb-8 pt-16 shadow-xl">
        {children}
      </div>
    </div>
  );
}
