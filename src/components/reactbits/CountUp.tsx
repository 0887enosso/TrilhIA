// Adaptado de React Bits (https://reactbits.dev/text-animations/count-up) —
// David Haz, licença MIT + Commons Clause (ver docs/THIRD-PARTY-NOTICES.md).
//
// Duas correções sobre o original, ambas achadas medindo o componente no ar:
//
// 1. `duration` não valia nada. O original anima com `useSpring`, e mola não
//    tem duração: ela se aproxima do alvo assintoticamente. Medido em
//    produção, `duration={1}` levava 3,4s pra sair de 0 e chegar em 115 — os
//    últimos cinco pontos sozinhos levavam 2s. Agora é um tween real, que
//    termina exatamente no tempo pedido.
//
// 2. O valor não existia no HTML do servidor. O original devolve um `<span>`
//    vazio e só escreve o número depois que o React hidrata, então o chip de
//    XP aparecia em branco na primeira pintura (e ficava em branco pra sempre
//    sem JS). Agora o número certo já vem no HTML; a animação, quando
//    acontece, começa por cima dele.
"use client";

import { useCallback, useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  separator?: string;
  /**
   * Quando falso, o número aparece direto no valor final, sem contagem.
   * Serve pros lugares onde o valor não mudou — animar ali não comemora
   * nada, só faz a tela parecer que ainda está carregando.
   */
  animar?: boolean;
};

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  className = "",
  separator = ".",
  animar = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const jaAnimou = useRef(false);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const formatar = useCallback(
    (valor: number) => {
      const texto = Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Math.round(valor));
      return separator ? texto.replace(/\./g, separator) : texto;
    },
    [separator]
  );

  useEffect(() => {
    if (!animar || !isInView || jaAnimou.current) return;
    jaAnimou.current = true;

    const controles = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (valor) => {
        if (ref.current) ref.current.textContent = formatar(valor);
      },
    });
    return () => controles.stop();
  }, [animar, isInView, from, to, duration, formatar]);

  // O valor final já vai no HTML do servidor: sem JS, ou antes da hidratação,
  // o número certo está lá em vez de um espaço vazio.
  return (
    <span className={className} ref={ref}>
      {formatar(to)}
    </span>
  );
}
