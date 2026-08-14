import { prisma } from "./prisma";
import { todasQuestoesDoModulo, parseQuestaoId } from "./content";
import { inicioDoDiaBrasil } from "./tempo";
import { atualizarStreak, type DadosStreakUsuario } from "./streak";
import { processarConquistasEngajamento } from "./badgesEngajamento";

const QUESTOES_POR_DESAFIO = 5;
const XP_BONUS_DESAFIO_DIARIO = 30;

/**
 * Escolhe as questões do desafio de hoje: parte do módulo mais recente que o
 * usuário tocou (seu "nível" atual) e, se esse módulo não tiver questões
 * suficientes, completa com módulos anteriores — sempre conteúdo que o
 * usuário já viu antes, nunca matéria nova. Amostra aleatória dentro desse
 * conjunto.
 */
async function selecionarQuestoesDoDesafio(usuarioId: string): Promise<string[]> {
  const modulosTocados = await prisma.progressoModulo.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
  });

  if (modulosTocados.length === 0) return []; // ainda não iniciou nenhum módulo

  const pool: string[] = [];
  for (const registro of modulosTocados) {
    const trilha = registro.trilha === "basica" ? "basica" : "intermediaria";
    const questoes = todasQuestoesDoModulo(trilha, registro.moduloId);
    pool.push(...questoes.map((q: any) => q.id as string));
    if (pool.length >= QUESTOES_POR_DESAFIO * 2) break; // já tem pool suficiente pra sortear
  }

  const embaralhado = [...pool];
  for (let i = embaralhado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhado[i], embaralhado[j]] = [embaralhado[j], embaralhado[i]];
  }

  return embaralhado.slice(0, QUESTOES_POR_DESAFIO);
}

/** Busca o desafio de hoje do usuário, criando um novo (com questões sorteadas) se ainda não existir. */
export async function obterOuCriarDesafioDeHoje(usuarioId: string) {
  const hoje = inicioDoDiaBrasil(new Date());

  const existente = await prisma.desafioDiario.findUnique({
    where: { usuarioId_data: { usuarioId, data: hoje } },
  });
  if (existente) return existente;

  const questaoIds = await selecionarQuestoesDoDesafio(usuarioId);
  // Hoje impossível na prática (todo módulo tem 7+ questões, então mesmo um
  // único módulo tocado já preenche o pool) — mas se o conteúdo algum dia
  // tiver um módulo com poucas questões, é melhor não oferecer um "desafio
  // diário" incompleto (menos que QUESTOES_POR_DESAFIO) do que criar um
  // silenciosamente menor do que o prometido.
  if (questaoIds.length < QUESTOES_POR_DESAFIO) return null;

  return prisma.desafioDiario.create({
    data: { usuarioId, data: hoje, questaoIds },
  });
}

/**
 * Chamada pelo endpoint de responder questão sempre que uma resposta é
 * registrada. Se a questão pertence ao desafio de hoje do usuário e todas as
 * questões do desafio já foram respondidas ao menos uma vez, concede o bônus
 * de conclusão (uma única vez, via checagem do campo `concluido`) e avança o
 * foguinho de engajamento (`atualizarStreak`) — é este o único gatilho do
 * foguinho hoje; responder questões fora do desafio diário não avança nem
 * mantém o foguinho vivo.
 *
 * NÃO grava xpTotal/nivel do usuário nem soma XP semanal de liga — isso é
 * responsabilidade de quem chama (`route.ts`), que combina este bônus com o
 * XP da própria questão e grava tudo em uma única escrita ao final da
 * requisição. Esta função só decide e persiste a conclusão do desafio em si
 * (e o avanço do foguinho, que está diretamente ligado a essa conclusão).
 */
export async function processarRespostaParaDesafioDiario(
  usuarioId: string,
  questaoId: string,
  dadosStreak: DadosStreakUsuario
): Promise<{ desafioConcluidoAgora: boolean; xpBonus: number } | null> {
  const hoje = inicioDoDiaBrasil(new Date());

  const desafio = await prisma.desafioDiario.findUnique({
    where: { usuarioId_data: { usuarioId, data: hoje } },
  });

  if (!desafio || desafio.concluido || !desafio.questaoIds.includes(questaoId)) {
    return null;
  }

  const respondidasHoje = await prisma.respostaQuestao.findMany({
    where: {
      usuarioId,
      questaoId: { in: desafio.questaoIds },
      respondidoEm: { gte: hoje },
    },
    select: { questaoId: true },
    distinct: ["questaoId"],
  });

  const todasRespondidas = desafio.questaoIds.every((id) =>
    respondidasHoje.some((r) => r.questaoId === id)
  );

  if (!todasRespondidas) return null;

  // updateMany condicionado a concluido:false — evita conceder o bônus duas
  // vezes se duas respostas da última questão chegarem quase juntas.
  const resultado = await prisma.desafioDiario.updateMany({
    where: { id: desafio.id, concluido: false },
    data: { concluido: true, concluidoEm: new Date(), xpBonusConcedido: XP_BONUS_DESAFIO_DIARIO },
  });

  if (resultado.count === 0) return null; // outra requisição já concedeu o bônus primeiro

  const eraPrimeiraVez = dadosStreak.ultimoDesafioDiarioConcluidoEm === null;
  const resultadoStreak = await atualizarStreak(usuarioId, dadosStreak);
  if (resultadoStreak) {
    await processarConquistasEngajamento(usuarioId, eraPrimeiraVez, resultadoStreak, prisma);
  }

  return { desafioConcluidoAgora: true, xpBonus: XP_BONUS_DESAFIO_DIARIO };
}

export { parseQuestaoId };
