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

const XP_POR_NIVEL = 300;

/**
 * Fórmula de nível — placeholder simples e deliberadamente linear.
 * Ajustável sem quebrar nada: nenhum outro lugar do código depende da
 * fórmula em si, só do valor de retorno.
 */
export function calcularNivel(xpTotal: number): number {
  return 1 + Math.floor(xpTotal / XP_POR_NIVEL);
}

/**
 * Quanto do nível atual já foi percorrido — usado pela barra de nível do
 * dashboard. Mora aqui junto de `calcularNivel` de propósito: quem exibe não
 * precisa saber que a progressão é linear, então trocar a fórmula continua
 * sendo uma mudança de um arquivo só.
 */
export function progressoDoNivel(xpTotal: number): {
  xpNoNivel: number;
  xpParaProximo: number;
  percentual: number;
} {
  const xpNoNivel = xpTotal % XP_POR_NIVEL;
  return {
    xpNoNivel,
    xpParaProximo: XP_POR_NIVEL - xpNoNivel,
    percentual: Math.round((xpNoNivel / XP_POR_NIVEL) * 100),
  };
}
