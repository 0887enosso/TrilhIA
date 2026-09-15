"use client";

import { useSyncExternalStore } from "react";

/**
 * Os três valores do HUD que uma resposta de questão muda — e que a própria
 * resposta da API já devolve.
 *
 * Existe para tirar o `router.refresh()` do caminho de toda questão
 * respondida. O TopHud mora no layout autenticado, e no App Router um layout
 * não é re-renderizado a cada interação dentro da página: sem alguma forma de
 * sincronização, ele congelava nos valores de quando a página abriu e mostrava
 * coração cheio depois do usuário já ter errado. A solução até aqui era pedir
 * ao servidor para refazer a árvore inteira (`router.refresh()`), o que custava
 * ~375ms de trabalho de servidor por questão só para atualizar três números
 * que a resposta da API já tinha em mãos.
 *
 * O escopo é deliberadamente pequeno. Foi verificado que, por questão
 * respondida, só estes três campos mudam:
 *
 * - `estrelasDiariasRestantes` deriva de `modulosIniciadosHoje`, que muda ao
 *   INICIAR um módulo, não ao responder (ver src/lib/limiteDiario.ts).
 * - `streakAtual` só avança quando o desafio diário é concluído (ver
 *   src/lib/desafioDiario.ts) — por isso o DesafioClient continua dando
 *   refresh nesse momento específico.
 *
 * Qualquer campo fora dessa lista continua vindo do servidor. Quem lê faz a
 * mistura: servidor como base, este ajuste por cima.
 */
export type AjusteHud = {
  coracoesAtuais: number;
  xpTotal: number;
  nivel: number;
};

let ajuste: AjusteHud | null = null;
const ouvintes = new Set<() => void>();

/** Chamado por quem acabou de receber valores novos da API. */
export function publicarAjusteHud(novo: AjusteHud): void {
  ajuste = novo;
  for (const avisar of ouvintes) avisar();
}

/**
 * Descarta o ajuste porque o servidor vai mandar valores mais novos que os
 * daqui. Necessário antes de um `router.refresh()` que possa mexer nestes
 * mesmos três campos — conclusão de módulo (que concede XP de bônus) e
 * regeneração de corações. Sem isso, o ajuste antigo ficaria sobrepondo o
 * dado fresco do servidor indefinidamente.
 */
export function limparAjusteHud(): void {
  ajuste = null;
  for (const avisar of ouvintes) avisar();
}

function inscrever(avisar: () => void): () => void {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

function lerNoCliente(): AjusteHud | null {
  return ajuste;
}

// No servidor nunca há ajuste: o HTML sai com o valor que o próprio servidor
// acabou de ler. Precisa ser uma referência estável, senão o React acusa
// loop de renderização.
function lerNoServidor(): AjusteHud | null {
  return null;
}

export function useAjusteHud(): AjusteHud | null {
  return useSyncExternalStore(inscrever, lerNoCliente, lerNoServidor);
}
