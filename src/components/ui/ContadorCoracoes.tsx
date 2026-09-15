"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { limparAjusteHud } from "@/components/app/estadoHud";

/**
 * Cronômetro de regeneração de vidas — mostra "Vidas voltam em Xh Ymin" a
 * partir de `liberamEm` (ISO string vinda de ResumoUsuario.coracoesLiberamEm
 * ou do corpo de erro `sem_coracoes`, ver src/lib/coracoes.ts). Quando o
 * tempo zera, dá um único `router.refresh()` para puxar o estado atualizado
 * do servidor (que já regenerou os corações) e some — a barra de corações
 * volta a aparecer normal a partir do dado atualizado do servidor.
 */
export function ContadorCoracoes({
  liberamEm,
  curto = false,
}: {
  liberamEm: string | null;
  /** No HUD o rótulo já tem os corações ao lado, então basta "volta em X".
   *  Solto (tela de "sem energia"), a frase precisa se explicar sozinha. */
  curto?: boolean;
}) {
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
          // A regeneração acontece no servidor: o número de corações que ele
          // vai devolver é mais novo que o ajuste local guardado pela última
          // questão respondida. Descarta o ajuste, senão ele sobreporia os
          // corações recém-regenerados com o valor antigo (ver estadoHud.ts).
          limparAjusteHud();
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

  if (curto) {
    return (
      <span className="font-variant-tabular text-[10px] font-bold text-ink-faint">volta em {texto}</span>
    );
  }

  return (
    <span className="font-variant-tabular rounded-full bg-coral-soft px-3 py-1 text-sm font-bold text-coral-strong">
      Vidas voltam em {texto}
    </span>
  );
}
