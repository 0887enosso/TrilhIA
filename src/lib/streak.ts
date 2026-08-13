import { prisma } from "./prisma";
import { inicioDoDiaBrasil } from "./tempo";

function diasEntre(a: Date, b: Date): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round((inicioDoDiaBrasil(b).getTime() - inicioDoDiaBrasil(a).getTime()) / msPorDia);
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
 *
 * Todas as escritas usam `updateMany` condicionado ao `ultimoDiaAtivo` (e,
 * quando aplicável, `streakFreezesDisponiveis`) exatamente como foram lidos
 * por quem chamou — não um `update` incondicional. Sem isso, duas respostas
 * de questão quase simultâneas do mesmo usuário (duas abas, um retry de
 * rede) liam o mesmo estado "antes" e as duas aplicavam o mesmo incremento,
 * inflando a streak (medido: +8 numa rodada de 8 requisições paralelas) e
 * podendo deixar o freeze negativo. Se o `updateMany` não afetar nenhuma
 * linha (`count === 0`), outra requisição concorrente já aplicou essa mesma
 * transição — não é erro, só um no-op silencioso (streak não é devolvida na
 * resposta da rota, então isso é seguro).
 */
export async function atualizarStreak(
  usuarioId: string,
  usuario: DadosStreakUsuario
): Promise<void> {
  const hoje = new Date();

  if (!usuario.ultimoDiaAtivo) {
    await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDiaAtivo: null },
      data: { streakAtual: 1, ultimoDiaAtivo: hoje },
    });
    return;
  }

  const gap = diasEntre(usuario.ultimoDiaAtivo, hoje);

  if (gap === 0) return;

  if (gap === 1) {
    await prisma.usuario.updateMany({
      where: { id: usuarioId, ultimoDiaAtivo: usuario.ultimoDiaAtivo },
      data: { streakAtual: { increment: 1 }, ultimoDiaAtivo: hoje },
    });
    return;
  }

  if (gap === 2 && usuario.streakFreezesDisponiveis > 0) {
    await prisma.usuario.updateMany({
      where: {
        id: usuarioId,
        ultimoDiaAtivo: usuario.ultimoDiaAtivo,
        streakFreezesDisponiveis: { gt: 0 },
      },
      data: {
        streakFreezesDisponiveis: { decrement: 1 },
        streakAtual: { increment: 1 },
        ultimoDiaAtivo: hoje,
      },
    });
    return;
  }

  await prisma.usuario.updateMany({
    where: { id: usuarioId, ultimoDiaAtivo: usuario.ultimoDiaAtivo },
    data: { streakAtual: 1, ultimoDiaAtivo: hoje },
  });
}
