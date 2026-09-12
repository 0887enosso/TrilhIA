"use client";

import { useEffect, useState } from "react";

const CORES = ["#3FA76A", "#F0B03C", "#E2492F", "#33513C", "#FFC24A", "#2A7F4F"];

type Peca = {
  id: number;
  esquerda: number;
  atraso: number;
  duracao: number;
  cor: string;
  largura: number;
  altura: number;
  redondo: boolean;
};

/**
 * Chuva de confete para os momentos de recompensa (módulo concluído,
 * desafio diário concluído).
 *
 * As peças só são geradas DEPOIS da montagem, num efeito, e não durante a
 * renderização: os valores são aleatórios, então gerá-los no corpo do
 * componente faria o HTML do servidor divergir do primeiro render do
 * cliente e quebraria a hidratação. Renderizar nada no servidor também é o
 * comportamento certo aqui — confete é puramente decorativo.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos animação não recebe
 * nada em vez de receber uma versão estática (peças paradas na tela seriam
 * ruído sem propósito).
 */
export function Confete({ pecas = 40 }: { pecas?: number }) {
  const [itens, setItens] = useState<Peca[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setItens(
      Array.from({ length: pecas }, (_, i) => ({
        id: i,
        esquerda: Math.random() * 100,
        atraso: Math.random() * 0.8,
        duracao: 2.6 + Math.random() * 1.8,
        cor: CORES[i % CORES.length],
        largura: 6 + Math.random() * 6,
        altura: 9 + Math.random() * 9,
        redondo: i % 3 === 0,
      }))
    );
  }, [pecas]);

  if (itens.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden print:hidden">
      {itens.map((peca) => (
        <span
          key={peca.id}
          className="confete absolute top-0 block"
          style={{
            left: `${peca.esquerda}%`,
            width: peca.largura,
            height: peca.altura,
            backgroundColor: peca.cor,
            borderRadius: peca.redondo ? "9999px" : "2px",
            animationDelay: `${peca.atraso}s`,
            animationDuration: `${peca.duracao}s`,
          }}
        />
      ))}
    </div>
  );
}
