import { prisma } from "./prisma";
import { inicioDoDiaBrasil } from "./tempo";

function diasEntre(a: Date, b: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round((inicioDoDiaBrasil(b).getTime() - inicioDoDiaBrasil(a).getTime()) / msPorDia);
}

/** Campos do usuário que `atualizarStreak` precisa — evita rebuscar o usuário
 * inteiro quando quem chama já os tem em mãos. */
export type DadosStreakUsuario = {
  ultimoDesafioDiarioConcluidoEm: Date | null;
  streakFreezesDisponiveis: number;
  streakAtual: number;
  maiorStreakJaAlcancado: number;
  streakUsouFreezeNaSequenciaAtual: boolean;
};

/** `null` = a chamada não mudou nada (mesmo dia já registrado, ou perdeu a
 * corrida para uma requisição concorrente que já aplicou a mesma transição —
 * ver nota de concorrência abaixo). Quem chama deve pular qualquer concessão
 * de emblema/troféu de streak quando o resultado é `null`. */
export type ResultadoAtualizarStreak = {
  streakAtual: number;
  // Estado acumulado da sequência ATUAL (pode ter sido marcado numa chamada
  // anterior) — usado por troféus que julgam a sequência inteira (Prazo
  // Peremptório / Recurso Provido).
  usouFreezeNaSequenciaAtual: boolean;
  // true só nesta chamada específica ter sido a que consumiu o freeze
  // (branch de 2 dias de gap) — usado pelo emblema "Pedido de Vista", que é
  // sobre o EVENTO de consumir, não sobre o estado acumulado.
  freezeConsumidoAgora: boolean;
  // true só quando o novo streak supera um recorde pessoal que já era > 1 —
  // ou seja, é uma recuperação de verdade após uma quebra, não só o 1º dia.
  bateuRecordePessoal: boolean;
} | null;

/**
 * Atualiza o foguinho (streak) do usuário com base na última vez que ele
 * CONCLUIU o desafio diário — não mais "respondeu qualquer questão". O
 * foguinho é o monitor de engajamento com o desafio diário especificamente:
 * chamada só por `processarRespostaParaDesafioDiario` (src/lib/desafioDiario.ts),
 * no momento em que a última questão do desafio do dia é respondida.
 *
 * Regras:
 * - Mesmo dia de novo → não faz nada (na prática, nem deveria ser chamada
 *   duas vezes no mesmo dia, já que o desafio só conclui uma vez — este
 *   caso é só uma proteção defensiva).
 * - Exatamente 1 dia depois do último desafio concluído → foguinho +1.
 * - 2 dias depois (perdeu 1 dia) e há streak freeze disponível → consome 1
 *   freeze, mantém o foguinho vivo e marca `streakUsouFreezeNaSequenciaAtual`.
 * - Qualquer outro caso (sem freeze, ou mais de 1 dia sem concluir o
 *   desafio) → foguinho zera e recomeça em 1 (o dia de hoje), e a marca de
 *   freeze da sequência reseta junto.
 *
 * Em todos os ramos, `maiorStreakJaAlcancado` é atualizado inline (`Math.max`
 * calculado aqui, não uma segunda ida ao banco) — é o recorde pessoal usado
 * pelos emblemas/troféus "Recorde Pessoal" e "Trânsito em Julgado".
 *
 * Todas as escritas usam `updateMany` condicionado ao
 * `ultimoDesafioDiarioConcluidoEm` (e, quando aplicável,
 * `streakFreezesDisponiveis`) exatamente como foram lidos por quem chamou —
 * não um `update` incondicional. Sem isso, duas conclusões de desafio quase
 * simultâneas do mesmo usuário (duas abas, um retry de rede) liam o mesmo
 * estado "antes" e as duas aplicavam o mesmo incremento, inflando o
 * foguinho e podendo deixar o freeze negativo (mesma classe de bug já
 * medida e corrigida quando isso ainda era disparado por toda resposta de
 * questão). Se o `updateMany` não afetar nenhuma linha (`count === 0`),
 * outra requisição concorrente já aplicou essa mesma transição — devolve
 * `null` em vez de inventar um resultado que esta chamada não causou de
 * verdade.
 */
export async function atualizarStreak(
  usuarioId: string,
  usuario: DadosStreakUsuario
): Promise<ResultadoAtualizarStreak> {
  const hoje = new Date();

  if (!usuario.ultimoDesafioDiarioConcluidoEm) {
    const resultado = await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: null },
      data: {
        streakAtual: 1,
        ultimoDesafioDiarioConcluidoEm: hoje,
        streakUsouFreezeNaSequenciaAtual: false,
        maiorStreakJaAlcancado: Math.max(usuario.maiorStreakJaAlcancado, 1),
      },
    });
    if (resultado.count === 0) return null;
    return { streakAtual: 1, usouFreezeNaSequenciaAtual: false, freezeConsumidoAgora: false, bateuRecordePessoal: false };
  }

  const gap = diasEntre(usuario.ultimoDesafioDiarioConcluidoEm, hoje);

  if (gap === 0) return null;

  if (gap === 1) {
    const novoStreak = usuario.streakAtual + 1;
    const resultado = await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm },
      data: {
        streakAtual: { increment: 1 },
        ultimoDesafioDiarioConcluidoEm: hoje,
        maiorStreakJaAlcancado: Math.max(usuario.maiorStreakJaAlcancado, novoStreak),
      },
    });
    if (resultado.count === 0) return null;
    return {
      streakAtual: novoStreak,
      usouFreezeNaSequenciaAtual: usuario.streakUsouFreezeNaSequenciaAtual,
      freezeConsumidoAgora: false,
      bateuRecordePessoal: novoStreak > usuario.maiorStreakJaAlcancado && usuario.maiorStreakJaAlcancado > 1,
    };
  }

  if (gap === 2 && usuario.streakFreezesDisponiveis > 0) {
    const novoStreak = usuario.streakAtual + 1;
    const resultado = await prisma.usuario.updateMany({
      where: {
        id: usuarioId,
        ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm,
        streakFreezesDisponiveis: { gt: 0 },
      },
      data: {
        streakFreezesDisponiveis: { decrement: 1 },
        streakAtual: { increment: 1 },
        ultimoDesafioDiarioConcluidoEm: hoje,
        streakUsouFreezeNaSequenciaAtual: true,
        maiorStreakJaAlcancado: Math.max(usuario.maiorStreakJaAlcancado, novoStreak),
      },
    });
    if (resultado.count === 0) return null;
    return {
      streakAtual: novoStreak,
      usouFreezeNaSequenciaAtual: true,
      freezeConsumidoAgora: true,
      bateuRecordePessoal: novoStreak > usuario.maiorStreakJaAlcancado && usuario.maiorStreakJaAlcancado > 1,
    };
  }

  const resultado = await prisma.usuario.updateMany({
    where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm },
    data: {
      streakAtual: 1,
      ultimoDesafioDiarioConcluidoEm: hoje,
      streakUsouFreezeNaSequenciaAtual: false,
      maiorStreakJaAlcancado: Math.max(usuario.maiorStreakJaAlcancado, 1),
    },
  });
  if (resultado.count === 0) return null;
  return { streakAtual: 1, usouFreezeNaSequenciaAtual: false, freezeConsumidoAgora: false, bateuRecordePessoal: false };
}
