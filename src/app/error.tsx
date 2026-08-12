"use client";

import { useEffect } from "react";
import { Mascote } from "@/components/mascote/Mascote";
import { Botao } from "@/components/ui/Botao";

export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment px-4 text-center font-sans text-ink">
        <Mascote pose="cansado" size={120} />
        <h1 className="font-sans text-2xl font-extrabold">Algo deu errado</h1>
        <p className="max-w-sm text-sm text-ink-soft">
          Não foi possível carregar esta página. Tente de novo — se continuar acontecendo, avise um administrador.
        </p>
        <div className="flex gap-3">
          <Botao onClick={reset}>Tentar de novo</Botao>
          <a href="/inicio">
            <Botao variante="secundaria">Voltar ao início</Botao>
          </a>
        </div>
      </body>
    </html>
  );
}
