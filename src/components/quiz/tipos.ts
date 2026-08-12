// Espelha o formato que sanitizarQuestaoParaCliente() (src/lib/content.ts)
// devolve para cada tipo de questão — nunca inclui gabarito.
type QuestaoBase = { id: string; tipo: string; enunciado: string };

export type QuestaoMultiplaEscolha = QuestaoBase & {
  tipo: "multipla_escolha" | "correcao_prompt";
  prompt_analisado?: string;
  alternativas: { id: string; texto: string }[];
};

export type QuestaoVerdadeiroFalso = QuestaoBase & {
  tipo: "verdadeiro_falso";
  justificativas: { id: string; texto: string }[];
};

export type QuestaoCompletarLacuna = QuestaoBase & {
  tipo: "completar_lacuna";
  lacunas: { posicao: number; opcoes: string[] }[];
};

export type QuestaoAssociacao = QuestaoBase & {
  tipo: "associacao";
  termos: string[];
  definicoes: string[];
};

export type QuestaoOrdenarEtapas = QuestaoBase & {
  tipo: "ordenar_etapas";
  etapas_embaralhadas: string[];
};

export type QuestaoAutoavaliada = QuestaoBase & {
  tipo: "resposta_curta_autoavaliada";
  criterios_autoavaliacao: string[];
};

export type Questao =
  | QuestaoMultiplaEscolha
  | QuestaoVerdadeiroFalso
  | QuestaoCompletarLacuna
  | QuestaoAssociacao
  | QuestaoOrdenarEtapas
  | QuestaoAutoavaliada;

export type ExplicacaoAutoavaliada = {
  criterios_autoavaliacao: string[];
  exemplo_de_resposta_forte: string;
};

export type ResultadoResposta = {
  correta: boolean | null;
  xpGanho: number;
  coracoesAtuais: number;
  xpTotal: number;
  nivel: number;
  explicacao: string | ExplicacaoAutoavaliada | undefined;
};
