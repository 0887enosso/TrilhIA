import { prisma } from "./prisma";

/**
 * Vidas (corações) regeneram sozinhas com o tempo — não existe mais nenhuma
 * ação do usuário ("reiniciar módulo") que restaure corações antes da hora.
 * Ver Usuario.coracoesZeradosEm no schema e docs/gamificacao.md.
 */
export const CORACOES_MAXIMO = 5;
export const TEMPO_REGENERACAO_MS = 2 * 60 * 60 * 1000; // 2 horas

type EstadoCoracoes = {
  coracoesAtuais: number;
  coracoesZeradosEm: Date | null;
};

type EstadoCoracoesCalculado = EstadoCoracoes & {
  prontoParaRegenerar: boolean;
  // corações zerados sem timestamp registrado — não deveria acontecer pelo
  // fluxo normal do app (todo lugar que zera corações grava o timestamp no
  // mesmo request), mas se surgir de outra forma (ferramenta futura, ajuste
  // manual no banco), sem isso o usuário ficaria travado com 0 corações pra
  // sempre, já que nada dispararia a regeneração. Em vez disso, tratamos como
  // "acabou de zerar agora" e começamos a contagem de 2h a partir daqui.
  precisaGravarZeramento: boolean;
};

/**
 * Função pura: dado o estado de corações persistido, calcula o estado real
 * considerando o tempo já passado desde que zeraram. Não toca no banco — só
 * quem chama decide se/quando persistir o resultado (ver
 * aplicarRegeneracaoSeNecessario abaixo).
 */
export function calcularCoracoesEfetivos(usuario: EstadoCoracoes): EstadoCoracoesCalculado {
  if (usuario.coracoesAtuais > 0) {
    return { ...usuario, prontoParaRegenerar: false, precisaGravarZeramento: false };
  }

  if (usuario.coracoesZeradosEm === null) {
    return { ...usuario, prontoParaRegenerar: false, precisaGravarZeramento: true };
  }

  const passou = Date.now() - usuario.coracoesZeradosEm.getTime();
  if (passou >= TEMPO_REGENERACAO_MS) {
    return {
      coracoesAtuais: CORACOES_MAXIMO,
      coracoesZeradosEm: null,
      prontoParaRegenerar: true,
      precisaGravarZeramento: false,
    };
  }

  return { ...usuario, prontoParaRegenerar: false, precisaGravarZeramento: false };
}

/**
 * Aplica no banco o que `calcularCoracoesEfetivos` decidiu — regenera pra
 * cheio se já passaram as 2h, ou grava o timestamp de zeramento agora se o
 * usuário estava no estado órfão (0 corações, sem timestamp). Se nenhum dos
 * dois casos se aplica, devolve o usuário como veio, sem escrita extra.
 */
export async function aplicarRegeneracaoSeNecessario<T extends EstadoCoracoes>(
  usuarioId: string,
  usuario: T
): Promise<T> {
  const calculado = calcularCoracoesEfetivos(usuario);

  if (calculado.prontoParaRegenerar) {
    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { coracoesAtuais: CORACOES_MAXIMO, coracoesZeradosEm: null },
    });
    // atualizado tem todos os campos escalares de Usuario, inclusive os dois
    // de EstadoCoracoes — o spread sobrescreve só esses, preservando qualquer
    // campo extra (ex: relação `equipe` incluída) que T tenha além deles.
    return { ...usuario, ...atualizado } as T;
  }

  if (calculado.precisaGravarZeramento) {
    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { coracoesZeradosEm: new Date() },
    });
    return { ...usuario, ...atualizado } as T;
  }

  return usuario;
}

/**
 * ISO string do momento em que os corações voltam ao máximo, ou null se não
 * há regeneração pendente (corações > 0, ou zerados sem regeneração possível
 * ainda registrada). Usado pelo frontend para montar o cronômetro — evita
 * duplicar a constante de 2h no cliente. Chame com o estado já efetivo (pós
 * aplicarRegeneracaoSeNecessario) para não mostrar um cronômetro que já
 * deveria ter zerado.
 */
export function calcularCoracoesLiberamEm(usuario: EstadoCoracoes): string | null {
  if (usuario.coracoesAtuais !== 0 || usuario.coracoesZeradosEm === null) {
    return null;
  }
  return new Date(usuario.coracoesZeradosEm.getTime() + TEMPO_REGENERACAO_MS).toISOString();
}
