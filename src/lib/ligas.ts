import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { listarIdsModulos } from "./content";

/** Cliente Prisma "normal" ou um cliente de transação (`tx` de `prisma.$transaction`) — mesma API para as duas coisas. */
type PrismaOuTransacao = typeof prisma | Prisma.TransactionClient;

/** Retorna a semana no formato ISO "YYYY-Www", usada como chave de agrupamento das ligas. */
export function semanaIsoDe(data: Date): string {
  const d = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const diaSemanaIso = d.getUTCDay() || 7; // domingo (0) vira 7
  d.setUTCDate(d.getUTCDate() + 4 - diaSemanaIso);
  const inicioDoAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const numeroSemana = Math.ceil(((d.getTime() - inicioDoAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(numeroSemana).padStart(2, "0")}`;
}

export function semanaIsoAtual(): string {
  return semanaIsoDe(new Date());
}

export function semanaIsoAnterior(): string {
  const seteDiasAtras = new Date();
  seteDiasAtras.setUTCDate(seteDiasAtras.getUTCDate() - 7);
  return semanaIsoDe(seteDiasAtras);
}

/** Inverso de `semanaIsoDe`: a segunda-feira (UTC) da semana ISO "YYYY-Www". */
function semanaIsoParaData(semanaIso: string): Date {
  const [anoStr, semanaStr] = semanaIso.split("-W");
  const ano = Number(anoStr);
  const semana = Number(semanaStr);
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const diaSemanaJan4 = jan4.getUTCDay() || 7;
  const segundaSemana1 = new Date(jan4);
  segundaSemana1.setUTCDate(jan4.getUTCDate() - diaSemanaJan4 + 1);
  const resultado = new Date(segundaSemana1);
  resultado.setUTCDate(segundaSemana1.getUTCDate() + (semana - 1) * 7);
  return resultado;
}

/**
 * Verifica se `atual` é exatamente a semana ISO seguinte a `anterior` — usado
 * pelas conquistas de liga que dependem de semanas CONSECUTIVAS (Presença
 * Confirmada, Maratonista da Liga, Sentença Unânime, Banca Permanente,
 * Reeleição). Comparar as strings "YYYY-Www" diretamente não basta na virada
 * do ano (ex: "2026-W52" → "2027-W01"), por isso a comparação é por data.
 */
export function saoSemanasConsecutivas(anterior: string, atual: string): boolean {
  const diffMs = semanaIsoParaData(atual).getTime() - semanaIsoParaData(anterior).getTime();
  return diffMs === 7 * 24 * 60 * 60 * 1000;
}

/** Verifica se o usuário concluiu todos os módulos da trilha básica. */
export async function trilhaBasicaConcluida(
  usuarioId: string,
  db: PrismaOuTransacao = prisma
): Promise<boolean> {
  const idsModulosBasica = listarIdsModulos("basica");
  const concluidos = await db.progressoModulo.count({
    where: {
      usuarioId,
      trilha: "basica",
      moduloId: { in: idsModulosBasica },
      concluido: true,
    },
  });
  return concluidos === idsModulosBasica.length;
}

/**
 * Retorna todas as ligas em que o usuário pode pontuar agora: a liga padrão
 * da própria equipe, mais qualquer liga exclusiva cuja condição de
 * desbloqueio ele já cumpre. Novas condições futuras (ex: trilha
 * intermediária concluída) entram como um novo "else if" aqui — e também em
 * `CONDICOES_DESBLOQUEIO_VALORES` (src/lib/condicoesLiga.ts), que é o que a
 * API de criação de liga usa para rejeitar uma condição digitada errado em
 * vez de silenciosamente criar uma liga sem nenhum participante possível.
 *
 * Aceita opcionalmente o client de transação (`tx`). Isso importa mais do
 * que em `trilhaBasicaConcluida`/afins: quando chamada de dentro de um
 * `prisma.$transaction(...)` (ver `adicionarXpSemanal`), rodar essas leituras
 * pelo client global em vez de `tx` exigia uma 2ª conexão do pool enquanto a
 * transação já segurava 1ª — sob concorrência real (~8 requisições
 * simultâneas do mesmo usuário disputando a mesma linha), isso esgotava o
 * pool de conexões e travava as respostas por vários segundos.
 */
export async function ligasElegiveis(
  usuarioId: string,
  equipeId: string,
  db: PrismaOuTransacao = prisma
) {
  // Uma leitura só, particionada em memória. Eram duas em `Promise.all`, o
  // que não ajudava no caso que importa: esta função roda quase sempre dentro
  // do `$transaction` de `adicionarXpSemanal`, e uma transação vive numa
  // conexão só — as duas consultas serializavam ali de qualquer jeito, mas
  // continuavam custando duas idas ao banco.
  const ligas = await db.liga.findMany({
    where: { OR: [{ tipo: "PADRAO", equipeId }, { tipo: "EXCLUSIVA" }] },
  });
  const ligasPadrao = ligas.filter((liga) => liga.tipo === "PADRAO");
  const ligasExclusivas = ligas.filter((liga) => liga.tipo === "EXCLUSIVA");

  const elegiveis = [];

  for (const liga of ligasExclusivas) {
    if (liga.equipeId && liga.equipeId !== equipeId) continue;

    if (!liga.condicaoDesbloqueio) {
      elegiveis.push(liga);
    } else if (liga.condicaoDesbloqueio === "trilha_basica_concluida") {
      if (await trilhaBasicaConcluida(usuarioId, db)) elegiveis.push(liga);
    }
    // condições futuras de desbloqueio entram aqui
  }

  return [...ligasPadrao, ...elegiveis];
}

export type RankingLiga = {
  ligaId: string;
  nome: string;
  tipo: string;
  semana: string;
  participantes: {
    usuarioId: string;
    nome: string;
    xpNaSemana: number;
    posicao: number;
    voce: boolean;
  }[];
};

/**
 * Ranking da semana corrente em cada liga elegível do usuário — usado pela
 * tela de liga do frontend. Antes desta função só existia leitura de ranking
 * por admin (GET /api/admin/ligas/[ligaId]/ranking); o colaborador não tinha
 * como ver a própria posição. A posição exibida usa `posicaoFinal` quando a
 * semana já foi apurada (ver /api/cron/semanal); antes disso, é calculada ao
 * vivo pela ordenação de xpNaSemana.
 */
export async function obterRankingSemanalDoUsuario(usuarioId: string): Promise<RankingLiga[]> {
  const semana = semanaIsoAtual();
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { equipeId: true },
  });
  const ligas = await ligasElegiveis(usuarioId, usuario.equipeId);
  if (ligas.length === 0) return [];

  // Uma única consulta para todas as ligas elegíveis (normalmente 1-2), em
  // vez de um findMany por liga — o usuário podia esperar N idas ao banco em
  // série (Promise.all ajuda, mas ainda são N round-trips) para montar uma
  // tela que só lista o próprio ranking semanal.
  const todasParticipacoes = await prisma.participacaoLiga.findMany({
    where: { ligaId: { in: ligas.map((l) => l.id) }, semana },
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: [{ xpNaSemana: "desc" }, { id: "asc" }],
  });

  const participacoesPorLiga = new Map<string, typeof todasParticipacoes>();
  for (const participacao of todasParticipacoes) {
    const lista = participacoesPorLiga.get(participacao.ligaId) ?? [];
    lista.push(participacao);
    participacoesPorLiga.set(participacao.ligaId, lista);
  }

  return ligas.map((liga) => {
    const participacoes = participacoesPorLiga.get(liga.id) ?? [];
    return {
      ligaId: liga.id,
      nome: liga.nome,
      tipo: liga.tipo,
      semana,
      participantes: participacoes.map((p, indice) => ({
        usuarioId: p.usuario.id,
        nome: p.usuario.nome,
        xpNaSemana: p.xpNaSemana,
        posicao: p.posicaoFinal ?? indice + 1,
        voce: p.usuario.id === usuarioId,
      })),
    };
  });
}

export type RankingAdminDaLiga = {
  liga: { id: string; nome: string; tipo: string };
  semana: string;
  ranking: { posicao: number; usuario: string; equipe: string; xpNaSemana: number }[];
} | null;

/**
 * Ranking da semana corrente de UMA liga específica, com nome do usuário e da
 * equipe de cada participante — usado pelo painel admin (visão de uma liga
 * só, diferente de `obterRankingSemanalDoUsuario`, que é "todas as ligas do
 * usuário logado"). Extraída de GET /api/admin/ligas/[ligaId]/ranking para
 * ser reaproveitada também pela página `/admin/ligas/[ligaId]` (Server
 * Component), no mesmo padrão já usado pelas outras telas do painel — a
 * página só existia como rota de API, sem tela própria (ver docs/frontend.md,
 * "o que fica para depois"). Retorna `null` se a liga não existir.
 */
export async function obterRankingAdminDaLiga(ligaId: string): Promise<RankingAdminDaLiga> {
  const liga = await prisma.liga.findUnique({ where: { id: ligaId } });
  if (!liga) return null;

  const semana = semanaIsoAtual();
  const participacoes = await prisma.participacaoLiga.findMany({
    where: { ligaId, semana },
    include: { usuario: { select: { nome: true, equipe: { select: { nome: true } } } } },
    orderBy: { xpNaSemana: "desc" },
  });

  return {
    liga: { id: liga.id, nome: liga.nome, tipo: liga.tipo },
    semana,
    ranking: participacoes.map((p, i) => ({
      posicao: i + 1,
      usuario: p.usuario.nome,
      equipe: p.usuario.equipe.nome,
      xpNaSemana: p.xpNaSemana,
    })),
  };
}

/**
 * Soma XP à(s) participação(ões) do usuário na semana corrente, em todas as
 * ligas elegíveis. Aceita opcionalmente o client de transação (`tx`) de um
 * `prisma.$transaction(...)` para que a concessão de XP semanal aconteça
 * atomicamente junto com o resto da concessão de XP da requisição — sem
 * isso, uma queda do processo entre gravar o XP total do usuário e somar o
 * XP semanal na liga deixava as duas fontes de XP divergentes.
 *
 * Conta de teste (`Usuario.contaTeste`) nunca ganha `ParticipacaoLiga` —
 * continua acumulando XP/nível/foguinho normalmente (para servir mesmo de
 * teste), só não compete contra colegas reais na liga.
 */
export async function adicionarXpSemanal(
  usuarioId: string,
  equipeId: string,
  xp: number,
  contaTeste: boolean,
  db: PrismaOuTransacao = prisma
): Promise<{ eraPrimeiraParticipacao: boolean }> {
  if (xp <= 0 || contaTeste) return { eraPrimeiraParticipacao: false };

  const semana = semanaIsoAtual();
  const ligas = await ligasElegiveis(usuarioId, equipeId, db);
  if (ligas.length === 0) return { eraPrimeiraParticipacao: false };

  // Lido ANTES do upsert — sinal para o emblema "Primeira Sustentação"
  // (src/lib/conquistasLiga.ts). Quem chama decide se concede o emblema;
  // esta função só informa o fato, mantendo o mesmo formato de
  // "retorna um resultado, quem chama aciona a conquista" usado em
  // `atualizarStreak` (src/lib/streak.ts) — evita import circular entre
  // ligas.ts e conquistasLiga.ts.
  const eraPrimeiraParticipacao = (await db.participacaoLiga.count({ where: { usuarioId } })) === 0;

  await Promise.all(
    ligas.map((liga) =>
      db.participacaoLiga.upsert({
        where: { ligaId_usuarioId_semana: { ligaId: liga.id, usuarioId, semana } },
        update: { xpNaSemana: { increment: xp } },
        create: { ligaId: liga.id, usuarioId, semana, xpNaSemana: xp },
      })
    )
  );

  return { eraPrimeiraParticipacao };
}
