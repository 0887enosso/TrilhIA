"use client";

import { Botao } from "@/components/ui/Botao";

export function ImprimirBotao() {
  return (
    <Botao variante="secundaria" onClick={() => window.print()}>
      Imprimir certificado
    </Botao>
  );
}
