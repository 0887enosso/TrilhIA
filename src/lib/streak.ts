import { prisma } from "./prisma";

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

function diasEntre(a: Date, b: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round((inicioDoDiaUTC(b).getTime() - inicioDoDiaUTC(a).getTime()) / msPorDia);
}

/** Campos do usuário que `atualizarStreak` precisa — evita rebuscar o usuário
 * inteiro quando quem chama já os tem em mãos. */
export type DadosStreakUsuario = {
  ultimoDiaAtivo: Date | null;
  streakFreezesDisponiveis: number;
};

/**
 * Atualiza o streak do usuário com base na última vez que ele esteve ativo.
 * Chamada uma vez por ação significativa (hoje: ao responder uma questão).
 *
 * Regras:
 * - Mesmo dia de novo → não faz nada.
 * - Exatamente 1 dia depois → streak +1.
 * - 2 dias depois (perdeu 1 dia) e há streak freeze disponível → consome 1
 *   freeze e mantém a sequência viva.
 * - Qualquer outro caso (sem freeze, ou mais de 1 dia perdido) → reinicia em 1.
 */
export async function atualizarStreak(
  usuarioId: string,
  usuario: DadosStreakUsuario
): Promise<void> {
  const hoje = new Date();

  if (!usuario.ultimoDiaAtivo) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { streakAtual: 1, ultimoDiaAtivo: hoje },
    });
    return;
  }

  const gap = diasEntre(usuario.ultimoDiaAtivo, hoje);

  if (gap === 0) return;

  if (gap === 1) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { streakAtual: { increment: 1 }, ultimoDiaAtivo: hoje },
    });
    return;
  }

  if (gap === 2 && usuario.streakFreezesDisponiveis > 0) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        streakFreezesDisponiveis: { decrement: 1 },
        streakAtual: { increment: 1 },
        ultimoDiaAtivo: hoje,
      },
    });
    return;
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { streakAtual: 1, ultimoDiaAtivo: hoje },
  });
}
