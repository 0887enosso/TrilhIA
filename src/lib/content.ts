import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

export type TrilhaId = "basica" | "intermediaria";

const PASTA_POR_TRILHA: Record<TrilhaId, string> = {
  basica: "trilha-basica",
  intermediaria: "trilha-intermediaria",
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

// Cache em memória por processo: os arquivos de conteúdo só mudam via deploy,
// então não há motivo para reler o mesmo JSON do disco a cada requisição.
const cacheModulos = new Map<string, any>();

type EntradaIndice = { moduloId: string; nomeArquivo: string; ordem: number };
const indicePorTrilha = new Map<TrilhaId, EntradaIndice[]>();

/**
 * O nome do arquivo em disco (`modulo-01.json`, `modulo-02.json`...) NÃO é o
 * mesmo valor do campo `modulo_id` dentro do JSON (`basica-01`,
 * `intermediaria-13`...) — que é a chave estável documentada em
 * docs/modelagem-dados.md e embutida no `id` de cada questão
 * (`basica-01-q1`). Por isso não dá pra montar o caminho do arquivo só
 * concatenando `${moduloId}.json`: é preciso um índice que mapeie
 * `modulo_id` → nome do arquivo, construído uma vez por processo (lendo
 * todos os arquivos da pasta) e ordenado pelo campo `ordem` do conteúdo —
 * essa é a fonte de verdade da sequência pedagógica, não o nome do arquivo.
 */
function obterIndice(trilha: TrilhaId): EntradaIndice[] {
  const existente = indicePorTrilha.get(trilha);
  if (existente) return existente;

  const pasta = path.join(CONTENT_ROOT, PASTA_POR_TRILHA[trilha], "modulos");
  const indice = fs
    .readdirSync(pasta)
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => {
      const nomeArquivo = arquivo.replace(".json", "");
      const conteudo = JSON.parse(fs.readFileSync(path.join(pasta, arquivo), "utf-8"));
      return { moduloId: conteudo.modulo_id as string, nomeArquivo, ordem: conteudo.ordem as number };
    })
    .sort((a, b) => a.ordem - b.ordem);

  indicePorTrilha.set(trilha, indice);
  return indice;
}

export function carregarModulo(trilha: TrilhaId, moduloId: string): any {
  const chave = `${trilha}:${moduloId}`;
  if (cacheModulos.has(chave)) return cacheModulos.get(chave);

  const entrada = obterIndice(trilha).find((e) => e.moduloId === moduloId);
  if (!entrada) {
    throw new Error(`Módulo não encontrado: ${chave}`);
  }

  const caminho = path.join(
    CONTENT_ROOT,
    PASTA_POR_TRILHA[trilha],
    "modulos",
    `${entrada.nomeArquivo}.json`
  );

  const conteudo = JSON.parse(fs.readFileSync(caminho, "utf-8"));
  cacheModulos.set(chave, conteudo);
  return conteudo;
}

export function buscarQuestao(trilha: TrilhaId, moduloId: string, questaoId: string): any {
  const questao = todasQuestoesDoModulo(trilha, moduloId).find((q: any) => q.id === questaoId);
  if (!questao) {
    throw new Error(`Questão não encontrada: ${questaoId} (módulo ${chave(trilha, moduloId)})`);
  }
  return questao;
}

/**
 * Retorna todas as questões de um módulo, vindas tanto da atividade embutida
 * em cada aula quanto da atividade final — a "planta baixa" usada tanto para
 * validar respostas quanto para checar se um módulo foi realmente cumprido
 * antes de deixar o usuário marcá-lo como concluído.
 *
 * O módulo 30 (projeto prático) não tem aulas/atividade_final — retorna lista
 * vazia, porque sua conclusão não depende de responder questões de quiz.
 */
export function todasQuestoesDoModulo(trilha: TrilhaId, moduloId: string): any[] {
  const modulo = carregarModulo(trilha, moduloId);
  if (!modulo.aulas) return [];

  const questoesDasAulas = modulo.aulas.map((aula: any) => aula.atividade);
  const questoesFinais = modulo.atividade_final ?? [];
  return [...questoesDasAulas, ...questoesFinais];
}

/** Extrai o trilha e o moduloId a partir do padrão de ID de questão (ex: "basica-01-q3"). */
export function parseQuestaoId(questaoId: string): { trilha: TrilhaId; moduloId: string } {
  const moduloId = questaoId.replace(/-q\d+$/, "");
  const trilha: TrilhaId = moduloId.startsWith("basica") ? "basica" : "intermediaria";
  return { trilha, moduloId };
}

function chave(trilha: TrilhaId, moduloId: string) {
  return `${trilha}:${moduloId}`;
}

/**
 * Metadados "de capa" de um módulo — sem aulas, sem questões, sem gabarito.
 * Usado para telas que precisam listar módulos (mapa de trilha, progresso
 * agregado) sem carregar/expor o conteúdo pedagógico inteiro.
 */
export function metadadosModulo(trilha: TrilhaId, moduloId: string) {
  const modulo = carregarModulo(trilha, moduloId);
  return {
    modulo_id: modulo.modulo_id as string,
    ordem: modulo.ordem as number,
    titulo: modulo.titulo as string,
    descricao_curta: modulo.descricao_curta as string,
    tempo_estimado_min: modulo.tempo_estimado_min as number,
    bloco: (modulo.bloco as string | undefined) ?? null,
    tipo_modulo: (modulo.tipo_modulo as string | undefined) ?? "quiz",
  };
}

/** Ids estáveis (`modulo_id`) de todos os módulos da trilha, na ordem pedagógica (`ordem`). */
export function listarIdsModulos(trilha: TrilhaId): string[] {
  return obterIndice(trilha).map((e) => e.moduloId);
}

export function carregarTransicaoBasicaParaIntermediaria(): any {
  const caminho = path.join(
    CONTENT_ROOT,
    "transicoes",
    "transicao-trilha-basica-para-intermediaria.json"
  );
  return JSON.parse(fs.readFileSync(caminho, "utf-8"));
}

// ---------------------------------------------------------------------------
// Validação de resposta — um caso por tipo de questão do schema de conteúdo.
// Retorna true/false para tipos com gabarito, ou null para tipos sem gabarito
// automático (resposta_curta_autoavaliada).
// ---------------------------------------------------------------------------

export function validarResposta(questao: any, resposta: any): boolean | null {
  switch (questao.tipo) {
    case "multipla_escolha":
    case "correcao_prompt": {
      const alternativa = questao.alternativas.find(
        (a: any) => a.id === resposta?.alternativaId
      );
      return alternativa ? alternativa.correta === true : false;
    }

    case "verdadeiro_falso": {
      const justificativa = questao.justificativas.find(
        (j: any) => j.id === resposta?.justificativaId
      );
      return justificativa ? justificativa.correta === true : false;
    }

    case "completar_lacuna": {
      const enviadas: { posicao: number; valor: string }[] = resposta?.respostas ?? [];
      return questao.lacunas.every((lacuna: any) => {
        const enviada = enviadas.find((r) => r.posicao === lacuna.posicao);
        return enviada?.valor === lacuna.correta;
      });
    }

    case "associacao": {
      const enviados: { termo: string; definicaoEscolhida: string }[] = resposta?.pares ?? [];
      return questao.pares.every((par: any) => {
        const enviado = enviados.find((p) => p.termo === par.termo);
        return enviado?.definicaoEscolhida === par.definicao;
      });
    }

    case "ordenar_etapas": {
      const ordemEnviada: string[] = resposta?.ordem ?? [];
      const esperado: string[] = questao.etapas_corretas;
      return (
        ordemEnviada.length === esperado.length &&
        ordemEnviada.every((etapa, i) => etapa === esperado[i])
      );
    }

    case "resposta_curta_autoavaliada":
      return null; // sem gabarito — autoavaliado pelo próprio usuário via checklist

    default:
      throw new Error(`Tipo de questão sem regra de validação: ${questao.tipo}`);
  }
}

/**
 * Verifica se o usuário de fato respondeu todas as questões do módulo antes
 * de permitir marcá-lo como concluído — sem isso, uma chamada direta à API
 * de conclusão (sem passar pelas questões) concedia badge e certificado sem
 * nenhum esforço real. Para tipos com gabarito, exige acerto; para
 * resposta_curta_autoavaliada (sem gabarito), exige só que tenha sido
 * respondida ao menos uma vez.
 */
export async function moduloFoiRealizado(
  usuarioId: string,
  trilha: TrilhaId,
  moduloId: string
): Promise<boolean> {
  const questoes = todasQuestoesDoModulo(trilha, moduloId);
  if (questoes.length === 0) return true; // módulo sem quiz (ex: projeto prático) — nada a checar aqui

  for (const questao of questoes) {
    const ehAutoavaliada = questao.tipo === "resposta_curta_autoavaliada";
    const resposta = await prisma.respostaQuestao.findFirst({
      where: ehAutoavaliada
        ? { usuarioId, questaoId: questao.id }
        : { usuarioId, questaoId: questao.id, correta: true },
    });
    if (!resposta) return false;
  }

  return true;
}
export function extrairExplicacao(questao: any, correta: boolean | null): any {
  switch (questao.tipo) {
    case "multipla_escolha":
    case "correcao_prompt":
      return correta ? questao.explicacao_acerto : questao.explicacao_erro;
    case "verdadeiro_falso":
      return questao.explicacao;
    case "resposta_curta_autoavaliada":
      // Só revelado DEPOIS que o usuário já respondeu — nunca antes, ou a
      // pessoa simplesmente copiaria o exemplo em vez de escrever a própria resposta.
      return {
        criterios_autoavaliacao: questao.criterios_autoavaliacao,
        exemplo_de_resposta_forte: questao.exemplo_de_resposta_forte,
      };
    default:
      // completar_lacuna, associacao e ordenar_etapas não têm campo de
      // explicação textual no schema atual — o frontend mostra só certo/errado.
      return undefined;
  }
}

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Remove todo campo que revele o gabarito, para uso em qualquer rota que
 * sirva conteúdo bruto ao cliente. NUNCA envie o resultado de
 * carregarModulo/buscarQuestao direto para o frontend — sempre passe por
 * aqui antes. Cada tipo de questão tem seu próprio "vazamento" possível:
 * `correta` nas alternativas, a ordem certa em `etapas_corretas`, o
 * pareamento certo na ordem de `pares` — todos removidos ou embaralhados
 * aqui.
 */
export function sanitizarQuestaoParaCliente(questao: any): any {
  const base = { id: questao.id, tipo: questao.tipo, enunciado: questao.enunciado };

  switch (questao.tipo) {
    case "multipla_escolha":
    case "correcao_prompt":
      return {
        ...base,
        ...(questao.prompt_analisado ? { prompt_analisado: questao.prompt_analisado } : {}),
        alternativas: questao.alternativas.map((a: any) => ({ id: a.id, texto: a.texto })),
      };

    case "verdadeiro_falso":
      return {
        ...base,
        justificativas: questao.justificativas.map((j: any) => ({ id: j.id, texto: j.texto })),
      };

    case "completar_lacuna":
      return {
        ...base,
        lacunas: questao.lacunas.map((l: any) => ({ posicao: l.posicao, opcoes: l.opcoes })),
      };

    case "associacao":
      // Enviar `pares` como está revelaria o gabarito na própria ordem do
      // array. Em vez disso, mandamos duas listas independentes, cada uma
      // embaralhada por conta própria — o cliente monta o par e envia de volta.
      return {
        ...base,
        termos: questao.pares.map((p: any) => p.termo),
        definicoes: embaralhar(questao.pares.map((p: any) => p.definicao)),
      };

    case "ordenar_etapas":
      return {
        ...base,
        etapas_embaralhadas: embaralhar(questao.etapas_corretas),
      };

    case "resposta_curta_autoavaliada":
      return {
        ...base,
        criterios_autoavaliacao: questao.criterios_autoavaliacao,
        // exemplo_de_resposta_forte fica de fora aqui de propósito — só
        // aparece depois de responder, via extrairExplicacao.
      };

    default:
      return base;
  }
}
