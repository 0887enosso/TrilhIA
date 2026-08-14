import { concederConquista, type PrismaOuTransacao } from "./conquistas";
import type { ResultadoAtualizarStreak } from "./streak";

const MARCOS_STREAK_EMBLEMA: { limiar: number; badgeId: string; nome: string; descricao: string }[] = [
  { limiar: 3, badgeId: "brasa-firme", nome: "Brasa Firme", descricao: "3 dias seguidos de desafio diário. A brasa pegou." },
  {
    limiar: 7,
    badgeId: "uma-semana-de-plantao",
    nome: "Uma Semana de Plantão",
    descricao: "7 dias seguidos. Uma semana inteira de plantão no hábito.",
  },
  {
    limiar: 14,
    badgeId: "habito-protocolado",
    nome: "Hábito Protocolado",
    descricao: "14 dias seguidos. Isso já não é sorte, é hábito.",
  },
  {
    limiar: 30,
    badgeId: "socio-do-habito",
    nome: "Sócio(a) do Hábito",
    descricao: "30 dias seguidos. Você não é mais estagiário do hábito.",
  },
];

const MARCOS_STREAK_TROFEU: { limiar: number; badgeId: string; nome: string; descricao: string }[] = [
  { limiar: 30, badgeId: "praxe-firmada", nome: "Praxe Firmada", descricao: "30 dias seguidos de desafio diário. Virou praxe — você não falha." },
  {
    limiar: 60,
    badgeId: "precedente-consolidado",
    nome: "Precedente Consolidado",
    descricao: "60 dias seguidos. Já é precedente — ninguém mais discute.",
  },
  {
    limiar: 90,
    badgeId: "trimestre-impecavel",
    nome: "Trimestre Impecável",
    descricao: "90 dias seguidos. Um trimestre inteiro sem deixar cair.",
  },
];

const LIMIAR_PRAZO_PEREMPTORIO_E_RECURSO_PROVIDO = 60;

/**
 * Emblemas e troféus de Engajamento/Foguinho/Desafio Diário — chamada por
 * `processarRespostaParaDesafioDiario` (src/lib/desafioDiario.ts) logo após
 * `atualizarStreak` retornar um resultado não-nulo (`null` = a chamada não
 * mudou nada, nenhuma conquista deve ser reavaliada).
 */
export async function processarConquistasEngajamento(
  usuarioId: string,
  eraPrimeiraVez: boolean,
  resultado: NonNullable<ResultadoAtualizarStreak>,
  db: PrismaOuTransacao
): Promise<void> {
  if (eraPrimeiraVez) {
    await concederConquista(
      db,
      usuarioId,
      "fosforo-aceso",
      "Fósforo Aceso",
      "Você concluiu seu primeiro desafio diário. O foguinho está aceso."
    );
  }

  for (const marco of MARCOS_STREAK_EMBLEMA) {
    if (resultado.streakAtual >= marco.limiar) {
      await concederConquista(db, usuarioId, marco.badgeId, marco.nome, marco.descricao);
    }
  }

  for (const marco of MARCOS_STREAK_TROFEU) {
    if (resultado.streakAtual >= marco.limiar) {
      await concederConquista(db, usuarioId, marco.badgeId, marco.nome, marco.descricao, "TROFEU");
    }
  }

  if (resultado.freezeConsumidoAgora) {
    await concederConquista(
      db,
      usuarioId,
      "pedido-de-vista",
      "Pedido de Vista",
      "Você perdeu um dia, mas um streak freeze salvou seu foguinho."
    );
  }

  if (resultado.bateuRecordePessoal) {
    await concederConquista(
      db,
      usuarioId,
      "recorde-pessoal",
      "Recorde Pessoal",
      "Você superou sua própria maior sequência de dias — prova de que recomeçar valeu a pena."
    );
  }

  if (resultado.streakAtual >= LIMIAR_PRAZO_PEREMPTORIO_E_RECURSO_PROVIDO) {
    if (resultado.usouFreezeNaSequenciaAtual) {
      await concederConquista(
        db,
        usuarioId,
        "recurso-provido",
        "Recurso Provido",
        "60 dias seguidos, com pelo menos um congelamento usado no caminho.",
        "TROFEU"
      );
    } else {
      await concederConquista(
        db,
        usuarioId,
        "prazo-peremptorio",
        "Prazo Peremptório",
        "60 dias seguidos sem nunca precisar de um congelamento. Prazo cumprido à risca.",
        "TROFEU"
      );
    }
  }

  // Trânsito em Julgado: troféu "vivo" — concedido uma vez, na primeira
  // sequência que exista (mesmo dia 1 já é um recorde). O número exibido
  // ("seu recorde: N dias") é lido ao vivo de Usuario.maiorStreakJaAlcancado
  // pelo frontend, não fica congelado na descrição salva aqui.
  await concederConquista(
    db,
    usuarioId,
    "transito-em-julgado",
    "Trânsito em Julgado",
    "Seu recorde pessoal de foguinho — mesmo que o streak quebre, essa marca fica registrada para sempre.",
    "TROFEU"
  );
}

/**
 * Reserva Técnica Completa — streakFreezesDisponiveis chega a 2 (teto).
 * Diferente dos demais emblemas de engajamento, este é verificado na
 * reposição semanal (cron), não a cada resposta de desafio diário — ver
 * src/app/api/cron/semanal/route.ts.
 */
export async function processarReservaTecnicaCompleta(usuarioId: string, db: PrismaOuTransacao): Promise<void> {
  await concederConquista(
    db,
    usuarioId,
    "reserva-tecnica-completa",
    "Reserva Técnica Completa",
    "Seus 2 streak freezes estão no teto. Reserva completa para o que der e vier."
  );
}
