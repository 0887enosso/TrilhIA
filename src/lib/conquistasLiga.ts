import { concederConquista, type PrismaOuTransacao } from "./conquistas";
import { saoSemanasConsecutivas } from "./ligas";

const PISO_PARTICIPANTES = 5;
const LIMIAR_FOTO_FINISH_XP = 50;
const N_VIRADA_DA_SEMANA = 5;
const N_PRESENCA_CONFIRMADA = 4;
const N_MARATONISTA_DA_LIGA = 10;
const N_SENTENCA_UNANIME = 3;
const N_BANCA_PERMANENTE = 8;
const N_CAMPEAO_DA_CORTE_SUPREMA = 2;
const N_AUTORIDADE_DA_EQUIPE = 15;
const LIMIAR_ELO_DA_EQUIPE_PERCENTUAL = 0.5;

type ParticipacaoResumo = { usuarioId: string; semana: string; xpNaSemana: number; posicaoFinal: number | null };

/** Maior sequência de semanas calendarmente consecutivas dentro de uma lista já ordenada. */
function temSequenciaConsecutiva(semanasOrdenadas: string[], tamanhoMinimo: number): boolean {
  if (semanasOrdenadas.length < tamanhoMinimo) return false;
  let tamanhoAtual = 1;
  for (let i = 1; i < semanasOrdenadas.length; i++) {
    tamanhoAtual = saoSemanasConsecutivas(semanasOrdenadas[i - 1], semanasOrdenadas[i]) ? tamanhoAtual + 1 : 1;
    if (tamanhoAtual >= tamanhoMinimo) return true;
  }
  return false;
}

/** "Foi 1º lugar, depois não foi, depois voltou a ser 1º" — em qualquer ponto da sequência, não só nas pontas. */
function houveQuedaERetomada(sequenciaDeFoiPrimeiro: boolean[]): boolean {
  let foiPrimeiroAlgumaVez = false;
  let caiuDepoisDeSerPrimeiro = false;
  for (const foiPrimeiro of sequenciaDeFoiPrimeiro) {
    if (foiPrimeiro) {
      if (caiuDepoisDeSerPrimeiro) return true;
      foiPrimeiroAlgumaVez = true;
    } else if (foiPrimeiroAlgumaVez) {
      caiuDepoisDeSerPrimeiro = true;
    }
  }
  return false;
}

/**
 * Emblemas e troféus de Liga/Equipe — chamada pelo cron semanal
 * (src/app/api/cron/semanal/route.ts) para CADA liga, logo depois que
 * `posicaoFinal` da semana recém-apurada já foi gravado nela.
 *
 * Só reavalia usuários que pontuaram NA SEMANA APURADA: para as conquistas
 * de janela única (Decisão Unânime, Pódio dos Autos, Foto-Finish, Virada da
 * Semana, Elo da Equipe) é logicamente o único grupo que pode ter mudado de
 * status; para as cumulativas/consecutivas (Presença Confirmada, Maratonista
 * da Liga, Sentença Unânime, Banca Permanente, Autoridade da Equipe,
 * Campeão da Corte Suprema, Reeleição) é o único grupo cujo estado pode ter
 * mudado nesta apuração — quem não pontuou não teve nenhuma semana nova
 * somada à própria sequência, e já foi avaliado corretamente nas apurações
 * anteriores (`concederConquista` é idempotente).
 *
 * Todo critério de "vitória"/"top N" exige `PISO_PARTICIPANTES` (5) na(s)
 * semana(s) contada(s) — decisão explícita da consolidação do catálogo para
 * que uma liga pequena não torne "1º lugar" trivial ou automático.
 */
export async function processarConquistasLiga(
  liga: { id: string; tipo: string; equipeId: string | null },
  semanaApurada: string,
  db: PrismaOuTransacao
): Promise<void> {
  const historico: ParticipacaoResumo[] = await db.participacaoLiga.findMany({
    where: { ligaId: liga.id },
    orderBy: { semana: "asc" },
    select: { usuarioId: true, semana: true, xpNaSemana: true, posicaoFinal: true },
  });

  const participantesDaSemanaApurada = historico.filter((p) => p.semana === semanaApurada);
  if (participantesDaSemanaApurada.length === 0) return;

  const semanas = new Map<string, ParticipacaoResumo[]>();
  for (const p of historico) {
    if (!semanas.has(p.semana)) semanas.set(p.semana, []);
    semanas.get(p.semana)!.push(p);
  }
  const semanasOrdenadas = [...semanas.keys()].sort();
  const semanasValidas = semanasOrdenadas.filter((s) => (semanas.get(s)?.length ?? 0) >= PISO_PARTICIPANTES);

  const semanasPorUsuario = new Map<string, string[]>();
  for (const [semana, participantes] of semanas) {
    for (const p of participantes) {
      if (!semanasPorUsuario.has(p.usuarioId)) semanasPorUsuario.set(p.usuarioId, []);
      semanasPorUsuario.get(p.usuarioId)!.push(semana);
    }
  }
  for (const lista of semanasPorUsuario.values()) lista.sort();

  const indiceSemanaApurada = semanasOrdenadas.indexOf(semanaApurada);
  const semanaAnterior = indiceSemanaApurada > 0 ? semanasOrdenadas[indiceSemanaApurada - 1] : null;
  const posicoesDaSemanaAnterior =
    semanaAnterior && saoSemanasConsecutivas(semanaAnterior, semanaApurada)
      ? new Map(semanas.get(semanaAnterior)!.map((p) => [p.usuarioId, p.posicaoFinal]))
      : null;

  const semanaAtendeOPiso = participantesDaSemanaApurada.length >= PISO_PARTICIPANTES;
  const lider = semanaAtendeOPiso
    ? [...participantesDaSemanaApurada].sort((a, b) => (a.posicaoFinal ?? 999) - (b.posicaoFinal ?? 999))[0]
    : null;

  // Elo da Equipe: coletivo, avaliado uma vez por liga PADRAO (não por usuário).
  let equipeGanhaEloDaEquipe = false;
  if (liga.tipo === "PADRAO" && liga.equipeId) {
    const membrosAtivos = await db.usuario.count({
      where: { equipeId: liga.equipeId, ativo: true, contaTeste: false },
    });
    equipeGanhaEloDaEquipe =
      membrosAtivos >= PISO_PARTICIPANTES &&
      participantesDaSemanaApurada.length / membrosAtivos >= LIMIAR_ELO_DA_EQUIPE_PERCENTUAL;
  }

  for (const participacao of participantesDaSemanaApurada) {
    const { usuarioId, posicaoFinal } = participacao;

    if (equipeGanhaEloDaEquipe) {
      await concederConquista(
        db,
        usuarioId,
        "elo-da-equipe",
        "Elo da Equipe",
        "Metade ou mais da sua equipe participou da liga essa semana — o time inteiro no jogo junto."
      );
    }

    if (semanaAtendeOPiso && posicaoFinal != null) {
      if (posicaoFinal === 1) {
        await concederConquista(
          db,
          usuarioId,
          "decisao-unanime",
          "Decisão Unânime",
          "Fechou a semana em 1º lugar na sua liga — decisão sem voto vencido."
        );
      }
      if (posicaoFinal <= 3) {
        await concederConquista(
          db,
          usuarioId,
          "podio-dos-autos",
          "Pódio dos Autos",
          "Fechou a semana entre os 3 primeiros da liga."
        );
      }
      if (posicaoFinal !== 1 && lider && lider.xpNaSemana - participacao.xpNaSemana < LIMIAR_FOTO_FINISH_XP) {
        await concederConquista(
          db,
          usuarioId,
          "foto-finish",
          "Foto-Finish",
          "Fechou a semana a menos de 50 XP do líder, sem ser campeão."
        );
      }
    }

    if (posicoesDaSemanaAnterior) {
      const posicaoAnterior = posicoesDaSemanaAnterior.get(usuarioId);
      if (posicaoAnterior != null && posicaoFinal != null && posicaoAnterior - posicaoFinal >= N_VIRADA_DA_SEMANA) {
        await concederConquista(
          db,
          usuarioId,
          "virada-da-semana",
          "Virada da Semana",
          "Subiu 5 ou mais posições em relação à semana anterior."
        );
      }
    }

    const minhasSemanas = semanasPorUsuario.get(usuarioId) ?? [];
    if (minhasSemanas.length >= N_MARATONISTA_DA_LIGA) {
      await concederConquista(
        db,
        usuarioId,
        "maratonista-da-liga",
        "Maratonista da Liga",
        "Participou de 10 semanas de liga (seguidas ou não) — constância de maratonista."
      );
    }
    if (temSequenciaConsecutiva(minhasSemanas, N_PRESENCA_CONFIRMADA)) {
      await concederConquista(
        db,
        usuarioId,
        "presenca-confirmada",
        "Presença Confirmada",
        "Disputou a liga por 4 semanas seguidas — presença é metade da vitória."
      );
    }

    const minhasSemanasValidas = semanasValidas.filter((s) => semanasPorUsuario.get(usuarioId)?.includes(s));
    const minhasVitoriasValidas = minhasSemanasValidas.filter(
      (s) => semanas.get(s)!.find((p) => p.usuarioId === usuarioId)?.posicaoFinal === 1
    );
    const meusTop3Validos = minhasSemanasValidas.filter((s) => {
      const pos = semanas.get(s)!.find((p) => p.usuarioId === usuarioId)?.posicaoFinal;
      return pos != null && pos <= 3;
    });

    if (liga.tipo === "PADRAO") {
      if (minhasVitoriasValidas.length >= N_AUTORIDADE_DA_EQUIPE) {
        await concederConquista(
          db,
          usuarioId,
          "autoridade-da-equipe",
          "Autoridade da Equipe",
          "15 semanas em 1º lugar na liga da sua equipe, ao longo da sua trajetória. Não é sorte, é rotina.",
          "TROFEU"
        );
      }
      if (temSequenciaConsecutiva(minhasVitoriasValidas, N_SENTENCA_UNANIME)) {
        await concederConquista(
          db,
          usuarioId,
          "sentenca-unanime",
          "Sentença Unânime",
          "Três semanas seguidas no topo da liga da sua equipe. Ninguém discutiu.",
          "TROFEU"
        );
      }
      if (temSequenciaConsecutiva(meusTop3Validos, N_BANCA_PERMANENTE)) {
        await concederConquista(
          db,
          usuarioId,
          "banca-permanente",
          "Banca Permanente",
          "Oito semanas seguidas entre os 3 primeiros da sua equipe. Constância também é vitória.",
          "TROFEU"
        );
      }
    }

    if (liga.tipo === "EXCLUSIVA" && minhasVitoriasValidas.length >= N_CAMPEAO_DA_CORTE_SUPREMA) {
      await concederConquista(
        db,
        usuarioId,
        "campeao-da-corte-suprema",
        "Campeão da Corte Suprema",
        "1º lugar em pelo menos 2 semanas na liga mais concorrida — a exclusiva de quem já terminou a Trilha Básica.",
        "TROFEU"
      );
    }

    const sequenciaDeFoiPrimeiro = minhasSemanasValidas.map(
      (s) => semanas.get(s)!.find((p) => p.usuarioId === usuarioId)?.posicaoFinal === 1
    );
    if (houveQuedaERetomada(sequenciaDeFoiPrimeiro)) {
      await concederConquista(
        db,
        usuarioId,
        "reeleicao",
        "Reeleição",
        "Você caiu do topo — e voltou. Resiliência também é liderança.",
        "TROFEU"
      );
    }
  }
}

/**
 * Primeira Sustentação — primeira participação em qualquer liga, sem piso.
 * Chamada pelo endpoint de resposta de questão (src/app/api/progresso/questao/responder/route.ts)
 * quando `adicionarXpSemanal` (src/lib/ligas.ts) sinaliza `eraPrimeiraParticipacao`.
 */
export async function processarPrimeiraSustentacao(usuarioId: string, db: PrismaOuTransacao): Promise<void> {
  await concederConquista(
    db,
    usuarioId,
    "primeira-sustentacao",
    "Primeira Sustentação",
    "Você entrou em campo: pontuou pela primeira vez em uma liga."
  );
}
