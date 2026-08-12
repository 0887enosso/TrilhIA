import { cache } from "react";
import { prisma } from "./prisma";
import { estrelasRestantesHoje } from "./limiteDiario";

export type ResumoUsuario = {
  id: string;
  nome: string;
  nickname: string;
  papel: "COLABORADOR" | "ADMIN";
  equipe: string;
  equipeId: string;
  xpTotal: number;
  nivel: number;
  streakAtual: number;
  streakFreezesDisponiveis: number;
  coracoesAtuais: number;
  estrelasDiariasRestantes: number;
  precisaTrocarSenha: boolean;
};

/**
 * Retrato do usuário logado — usado por GET /api/auth/me e diretamente pelo
 * layout autenticado do frontend (Server Component), que precisa dos mesmos
 * dados (streak, corações, estrelas) em toda página da área logada.
 *
 * Em `cache()`: o layout autenticado já busca isso pra montar o cabeçalho, e
 * várias páginas buscavam de novo pro próprio conteúdo — cada chamada extra
 * era outra ida ao Postgres remoto na mesma requisição.
 */
export const obterResumoUsuario = cache(async (usuarioId: string): Promise<ResumoUsuario | null> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { equipe: true },
  });
  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    nickname: usuario.nickname,
    papel: usuario.papel,
    equipe: usuario.equipe.nome,
    equipeId: usuario.equipeId,
    xpTotal: usuario.xpTotal,
    nivel: usuario.nivel,
    streakAtual: usuario.streakAtual,
    streakFreezesDisponiveis: usuario.streakFreezesDisponiveis,
    coracoesAtuais: usuario.coracoesAtuais,
    estrelasDiariasRestantes: estrelasRestantesHoje(usuario),
    precisaTrocarSenha: usuario.precisaTrocarSenha,
  };
});
