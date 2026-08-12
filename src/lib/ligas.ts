import { prisma } from "./prisma";
import { listarIdsModulos } from "./content";

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
export async function trilhaBasicaConcluida(usuarioId: string): Promise<boolean> {
  const idsModulosBasica = listarIdsModulos("basica");
  const concluidos = await prisma.progressoModulo.count({
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
 * intermediária concluída) entram como um novo "else if" aqui.
 */
export async function ligasElegiveis(usuarioId: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });

  const ligasPadrao = await prisma.liga.findMany({
    where: { tipo: "PADRAO", equipeId: usuario.equipeId },
  });

  const ligasExclusivas = await prisma.liga.findMany({ where: { tipo: "EXCLUSIVA" } });
  const elegiveis = [];

  for (const liga of ligasExclusivas) {
    if (liga.equipeId && liga.equipeId !== usuario.equipeId) continue;

    if (!liga.condicaoDesbloqueio) {
      elegiveis.push(liga);
    } else if (liga.condicaoDesbloqueio === "trilha_basica_concluida") {
      if (await trilhaBasicaConcluida(usuarioId)) elegiveis.push(liga);
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
  const ligas = await ligasElegiveis(usuarioId);

  return Promise.all(
    ligas.map(async (liga) => {
      const participacoes = await prisma.participacaoLiga.findMany({
        where: { ligaId: liga.id, semana },
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { xpNaSemana: "desc" },
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

/** Soma XP à(s) participação(ões) do usuário na semana corrente, em todas as ligas elegíveis. */
export async function adicionarXpSemanal(usuarioId: string, xp: number): Promise<void> {
  if (xp <= 0) return;

  const semana = semanaIsoAtual();
  const ligas = await ligasElegiveis(usuarioId);

  for (const liga of ligas) {
    await prisma.participacaoLiga.upsert({
      where: { ligaId_usuarioId_semana: { ligaId: liga.id, usuarioId, semana } },
      update: { xpNaSemana: { increment: xp } },
      create: { ligaId: liga.id, usuarioId, semana, xpNaSemana: xp },
    });
  }
}
