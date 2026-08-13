"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Cronômetro de regeneração de vidas — mostra "Vidas voltam em Xh Ymin" a
 * partir de `liberamEm` (ISO string vinda de ResumoUsuario.coracoesLiberamEm
 * ou do corpo de erro `sem_coracoes`, ver src/lib/coracoes.ts). Quando o
 * tempo zera, dá um único `router.refresh()` para puxar o estado atualizado
 * do servidor (que já regenerou os corações) e some — a barra de corações
 * volta a aparecer normal a partir do dado atualizado do servidor.
 */
export function ContadorCoracoes({ liberamEm }: { liberamEm: string | null }) {
  const router = useRouter();
  const [restanteMs, setRestanteMs] = useState<number | null>(null);
  const jaAtualizouRef = useRef(false);

  useEffect(() => {
    jaAtualizouRef.current = false;

    if (!liberamEm) {
      setRestanteMs(null);
      return;
    }

    const alvo = new Date(liberamEm).getTime();

    function tick(): boolean {
      const diff = alvo - Date.now();
      if (diff <= 0) {
        setRestanteMs(null);
        if (!jaAtualizouRef.current) {
          jaAtualizouRef.current = true;
          router.refresh();
        }
        return false;
      }
      setRestanteMs(diff);
      return true;
    }

    if (!tick()) return;

    const id = setInterval(() => {
      if (!tick()) clearInterval(id);
    }, 30_000);
    return () => clearInterval(id);
  }, [liberamEm, router]);

  if (liberamEm === null || restanteMs === null) return null;

  const horas = Math.floor(restanteMs / (60 * 60 * 1000));
  const minutos = Math.floor((restanteMs % (60 * 60 * 1000)) / (60 * 1000));
  const texto = horas > 0 ? `${horas}h ${minutos}min` : `${Math.max(minutos, 1)}min`;

  return <span className="font-mono text-xs text-ink-faint">Vidas voltam em {texto}</span>;
}
