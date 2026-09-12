"use client";

import { useEffect, useRef, useState } from "react";
import { IconeVida } from "./iconesJogo";

const TOTAL_CORACOES = 5;

/**
 * Barra de vidas. Além de trocar os caracteres ♥/♡ por ícones de verdade
 * (ver iconesJogo.tsx), reage à PERDA: quando `atuais` cai, a vida que
 * acabou de apagar treme por um instante. Sem isso, errar uma questão só
 * mudava silenciosamente um caractere no topo da tela — o usuário
 * frequentemente nem percebia que tinha perdido algo.
 */
export function Coracoes({
  atuais,
  tamanho = 22,
  className = "",
}: {
  atuais: number;
  tamanho?: number;
  className?: string;
}) {
  const anteriorRef = useRef(atuais);
  const [indicePerdido, setIndicePerdido] = useState<number | null>(null);

  useEffect(() => {
    const anterior = anteriorRef.current;
    anteriorRef.current = atuais;

    // Só anima quando de fato perdeu vida (não na primeira renderização nem
    // quando a regeneração devolve vidas).
    if (atuais >= anterior) return;

    setIndicePerdido(atuais);
    const id = setTimeout(() => setIndicePerdido(null), 450);
    return () => clearTimeout(id);
  }, [atuais]);

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`${atuais} de ${TOTAL_CORACOES} vidas`}
    >
      {Array.from({ length: TOTAL_CORACOES }, (_, i) => (
        <span key={i} className={i === indicePerdido ? "animate-tremer" : undefined}>
          <IconeVida cheia={i < atuais} tamanho={tamanho} />
        </span>
      ))}
    </div>
  );
}
