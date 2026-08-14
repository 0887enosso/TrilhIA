import { concederConquista, verificarDoutorEmIA, type PrismaOuTransacao } from "./conquistas";

const HORA_INICIO_CAFEZINHO = 12;
const HORA_FIM_CAFEZINHO = 14; // exclusivo — janela é [12h, 14h) no fuso de Brasília
const DIAS_MINIMOS_CAFEZINHO = 5;
const ACERTOS_DE_PRIMEIRA_SEM_EMBARGOS = 50;
const SEQUENCIA_MINIMA_COISA_JULGADA = 100;

/**
 * Emblemas/troféus de Maestria/Desempenho/Especiais disparados por resposta
 * de questão (não por conclusão de módulo — esses ficam em
 * `processarConquistasDoModulo`, ver src/lib/conquistas.ts). Chamada a
 * partir de POST /api/progresso/questao/responder.
 */

/** Primeira Petição — primeira resposta de questão já registrada, qualquer
 * trilha, independente de acerto. `totalRespostasAntes` é a contagem ANTES
 * de criar a resposta desta requisição (0 = é a primeira). */
export async function processarPrimeiraPeticao(
  usuarioId: string,
  totalRespostasAntes: number,
  db: PrismaOuTransacao
): Promise<void> {
  if (totalRespostasAntes === 0) {
    await concederConquista(
      db,
      usuarioId,
      "primeira-peticao",
      "Primeira Petição",
      "Toda carreira começa com a primeira petição protocolada. A sua começou aqui."
    );
  }
}

/** No Intervalo do Cafezinho — 5 dias-calendário distintos (Brasília) com ao
 * menos 1 resposta entre 12h e 14h. Só faz a varredura completa quando a
 * resposta desta requisição já caiu na janela — baixo custo no caso comum
 * (22 das 24h do dia não fazem nada além da comparação de hora). */
export async function processarIntervaloDoCafezinho(
  usuarioId: string,
  respondidoEm: Date,
  db: PrismaOuTransacao
): Promise<void> {
  const horaBrasilia = new Date(respondidoEm.getTime() - 3 * 60 * 60 * 1000).getUTCHours();
  if (horaBrasilia < HORA_INICIO_CAFEZINHO || horaBrasilia >= HORA_FIM_CAFEZINHO) return;

  const respostas = await db.respostaQuestao.findMany({
    where: { usuarioId },
    select: { respondidoEm: true },
  });

  const diasDistintos = new Set<string>();
  for (const r of respostas) {
    const hora = new Date(r.respondidoEm.getTime() - 3 * 60 * 60 * 1000);
    if (hora.getUTCHours() < HORA_INICIO_CAFEZINHO || hora.getUTCHours() >= HORA_FIM_CAFEZINHO) continue;
    diasDistintos.add(`${hora.getUTCFullYear()}-${hora.getUTCMonth()}-${hora.getUTCDate()}`);
  }

  if (diasDistintos.size >= DIAS_MINIMOS_CAFEZINHO) {
    await concederConquista(
      db,
      usuarioId,
      "intervalo-do-cafezinho",
      "No Intervalo do Cafezinho",
      "Aprendeu a aproveitar até o cafezinho. Respondeu questões entre 12h e 14h."
    );
  }
}

/** Voltou Por Cima — chamada só quando quem chama já detectou que os
 * corações acabaram de regenerar automaticamente de 0 para o máximo nesta
 * mesma requisição (comparação feita em responder/route.ts, que é quem tem
 * o "antes" e "depois" em mãos). */
export async function processarVoltouPorCima(usuarioId: string, db: PrismaOuTransacao): Promise<void> {
  await concederConquista(
    db,
    usuarioId,
    "voltou-por-cima",
    "Voltou Por Cima",
    "Ficou sem corações, esperou a reposição e voltou a responder."
  );
}

/** Associado Sênior / Sócio de Carreira — marcos de nível. Também
 * revalida "Doutor(a) em IA" aqui, já que nível é uma das duas condições
 * dele e muda exatamente neste ponto (a outra condição, os 2 certificados,
 * é revalidada em processarConquistasDoModulo quando um certificado é
 * emitido). */
export async function processarConquistasDeNivel(usuarioId: string, nivel: number, db: PrismaOuTransacao): Promise<void> {
  if (nivel >= 5) {
    await concederConquista(
      db,
      usuarioId,
      "associado-senior",
      "Associado Sênior",
      "Chegou ao nível 5. Já não é mais estagiário no assunto."
    );
  }
  if (nivel >= 10) {
    await concederConquista(
      db,
      usuarioId,
      "socio-de-carreira",
      "Sócio de Carreira",
      "Chegou ao nível 10. No papel e na prática, virou sócio da causa."
    );
  }
  if (nivel >= 20) {
    await verificarDoutorEmIA(db, usuarioId);
  }
}

/** Sem Embargos — 50 respostas cumulativas (não precisa ser em sequência)
 * com acerto na primeira tentativa. Só vale a pena contar quando a resposta
 * desta requisição É uma dessas (tentativas === 1 && correta === true) —
 * nos outros casos, o total não pode ter mudado. */
export async function processarSemEmbargos(
  usuarioId: string,
  foiAcertoDePrimeira: boolean,
  db: PrismaOuTransacao
): Promise<void> {
  if (!foiAcertoDePrimeira) return;

  const totalAcertosDePrimeira = await db.respostaQuestao.count({
    where: { usuarioId, tentativas: 1, correta: true },
  });

  if (totalAcertosDePrimeira >= ACERTOS_DE_PRIMEIRA_SEM_EMBARGOS) {
    await concederConquista(
      db,
      usuarioId,
      "sem-embargos",
      "Sem Embargos",
      "50 questões acertadas de primeira. Sem embargos, sem discussão."
    );
  }
}

/** Coisa Julgada — sequência de 100 acertos seguidos, cruzando módulos e
 * trilhas (zera no primeiro erro; autoavaliada não conta nem quebra).
 * `sequenciaAcertosAtual` já vem calculada por quem chama (mesma transação
 * que a atualizou via increment atômico — ver responder/route.ts). */
export async function processarCoisaJulgada(
  usuarioId: string,
  sequenciaAcertosAtual: number,
  db: PrismaOuTransacao
): Promise<void> {
  if (sequenciaAcertosAtual >= SEQUENCIA_MINIMA_COISA_JULGADA) {
    await concederConquista(
      db,
      usuarioId,
      "coisa-julgada",
      "Coisa Julgada",
      "100 acertos seguidos, sem interrupção, atravessando as duas trilhas — uma decisão que não cabe mais recurso.",
      "TROFEU"
    );
  }
}
