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
};

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
 *   freeze e mantém o foguinho vivo.
 * - Qualquer outro caso (sem freeze, ou mais de 1 dia sem concluir o
 *   desafio) → foguinho zera e recomeça em 1 (o dia de hoje).
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
 * outra requisição concorrente já aplicou essa mesma transição — não é
 * erro, só um no-op silencioso.
 */
export async function atualizarStreak(
  usuarioId: string,
  usuario: DadosStreakUsuario
): Promise<void> {
  const hoje = new Date();

  if (!usuario.ultimoDesafioDiarioConcluidoEm) {
    await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: null },
      data: { streakAtual: 1, ultimoDesafioDiarioConcluidoEm: hoje },
    });
    return;
  }

  const gap = diasEntre(usuario.ultimoDesafioDiarioConcluidoEm, hoje);

  if (gap === 0) return;

  if (gap === 1) {
    await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm },
      data: { streakAtual: { increment: 1 }, ultimoDesafioDiarioConcluidoEm: hoje },
    });
    return;
  }

  if (gap === 2 && usuario.streakFreezesDisponiveis > 0) {
    await prisma.usuario.updateMany({
      where: {
        id: usuarioId,
        ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm,
        streakFreezesDisponiveis: { gt: 0 },
      },
      data: {
        streakFreezesDisponiveis: { decrement: 1 },
        streakAtual: { increment: 1 },
        ultimoDesafioDiarioConcluidoEm: hoje,
      },
    });
    return;
  }

  await prisma.usuario.updateMany({
    where: { id: usuarioId, ultimoDesafioDiarioConcluidoEm: usuario.ultimoDesafioDiarioConcluidoEm },
    data: { streakAtual: 1, ultimoDesafioDiarioConcluidoEm: hoje },
  });
}
