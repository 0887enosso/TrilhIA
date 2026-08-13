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
  const [ligasPadrao, ligasExclusivas] = await Promise.all([
    db.liga.findMany({ where: { tipo: "PADRAO", equipeId } }),
    db.liga.findMany({ where: { tipo: "EXCLUSIVA" } }),
  ]);

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

  return Promise.all(
    ligas.map(async (liga) => {
      const participacoes = await prisma.participacaoLiga.findMany({
        where: { ligaId: liga.id, semana },
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: [{ xpNaSemana: "desc" }, { id: "asc" }],
      });

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
    })
  );
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
): Promise<void> {
  if (xp <= 0 || contaTeste) return;

  const semana = semanaIsoAtual();
  const ligas = await ligasElegiveis(usuarioId, equipeId, db);

  await Promise.all(
    ligas.map((liga) =>
      db.participacaoLiga.upsert({
        where: { ligaId_usuarioId_semana: { ligaId: liga.id, usuarioId, semana } },
        update: { xpNaSemana: { increment: xp } },
        create: { ligaId: liga.id, usuarioId, semana, xpNaSemana: xp },
      })
    )
  );
}
