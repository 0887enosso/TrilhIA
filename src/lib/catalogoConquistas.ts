/**
 * Lista única e estável de todas as chaves de EMBLEMA existentes no app —
 * as 7 estruturais (badgeId derivado do nome, já concedidas antes deste
 * catálogo existir) mais as 36 novas (chave explícita, nunca derivada de
 * nome, ver docs/gamificacao.md). Usada só pelo troféu "Tribunal Pleno"
 * para calcular a porcentagem de emblemas já conquistados — mantida à mão
 * (não derivada do conteúdo) porque a maioria dos emblemas novos não nasce
 * de um campo em JSON de módulo, ao contrário dos 7 estruturais.
 *
 * Troféus NÃO entram nesta lista de propósito — "Tribunal Pleno" conta só
 * emblemas, senão a meta de 80% ficaria móvel (crescendo a cada troféu
 * conquistado).
 */
export const EMBLEMAS_BADGE_IDS: readonly string[] = [
  // Estruturais (já existiam antes desta rodada)
  "letrado-em-ia",
  "arquiteto-de-prompts",
  "operador-de-ferramentas",
  "construtor-de-entregas",
  "decodificador-de-ia",
  "guardiao-de-integracoes",
  "mestre-em-ia-aplicada",
  // Trilha Básica
  "primeiro-protocolo",
  "metade-do-caminho",
  "boa-pergunta-boa-resposta",
  "guardiao-da-informacao",
  "olho-clinico",
  "sem-deslizes",
  // Trilha Intermediária
  "metade-do-prazo",
  "perito-assistente",
  "generalista-de-confianca",
  "negociador-de-clausulas",
  "investigador-de-bastidores",
  "redator-de-peticao",
  "sem-perder-o-ritmo",
  // Engajamento / Foguinho / Desafio Diário
  "fosforo-aceso",
  "brasa-firme",
  "uma-semana-de-plantao",
  "habito-protocolado",
  "socio-do-habito",
  "pedido-de-vista",
  "reserva-tecnica-completa",
  "recorde-pessoal",
  // Liga / Equipe / Social
  "primeira-sustentacao",
  "decisao-unanime",
  "podio-dos-autos",
  "presenca-confirmada",
  "maratonista-da-liga",
  "virada-da-semana",
  "foto-finish",
  "elo-da-equipe",
  // Maestria / Desempenho / Especiais
  "primeira-peticao",
  "intervalo-do-cafezinho",
  "voltou-por-cima",
  "associado-senior",
  "socio-de-carreira",
  "parecer-sem-ressalvas",
  "sem-embargos",
] as const;

/** Chave do troféu "colecionador" — excluída da própria contagem acima para
 * não virar um alvo móvel (conquistar o troféu não deveria contar pra ele
 * mesmo). Ele e os demais troféus não entram em EMBLEMAS_BADGE_IDS. */
export const TRIBUNAL_PLENO_BADGE_ID = "tribunal-pleno";
export const TRIBUNAL_PLENO_PERCENTUAL_MINIMO = 0.8;
