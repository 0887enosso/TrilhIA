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

export function xpPorTipoQuestao(tipo: string): number {
  return XP_POR_TIPO[tipo] ?? 10;
}

/**
 * Fórmula de nível — placeholder simples e deliberadamente linear.
 * Ajustável sem quebrar nada: nenhum outro lugar do código depende da
 * fórmula em si, só do valor de retorno.
 */
export function calcularNivel(xpTotal: number): number {
  return 1 + Math.floor(xpTotal / 300);
}
