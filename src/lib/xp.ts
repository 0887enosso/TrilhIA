// Tabela de XP por tipo de questão, definida na Fase 2 (docs/gamificacao.md).
// Perguntas que exigem mais esforço cognitivo valem mais.
const XP_POR_TIPO: Record<string, number> = {
  verdadeiro_falso: 10,
  completar_lacuna: 10,
  multipla_escolha: 15,
  associacao: 15,
  ordenar_etapas: 15,
  correcao_prompt: 20,
  resposta_curta_autoavaliada: 25,
};

/**
 * Falha alto (em vez de cair silenciosamente em 10 XP) quando o tipo não
 * está mapeado. Sem isso, um novo tipo de questão adicionado em
 * `validarResposta` (src/lib/content.ts) sem a linha correspondente aqui
 * pagava sempre o valor mais baixo pra sempre, sem nenhum aviso — os dois
 * mapas são independentes e precisam ser mantidos em sincronia manualmente.
 */
export function xpPorTipoQuestao(tipo: string): number {
  const xp = XP_POR_TIPO[tipo];
  if (xp === undefined) {
    throw new Error(`Tipo de questão sem valor de XP definido: ${tipo}`);
  }
  return xp;
}

/**
 * Fórmula de nível — placeholder simples e deliberadamente linear.
 * Ajustável sem quebrar nada: nenhum outro lugar do código depende da
 * fórmula em si, só do valor de retorno.
 */
export function calcularNivel(xpTotal: number): number {
  return 1 + Math.floor(xpTotal / 300);
}
