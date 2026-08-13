import { prisma } from "./prisma";

export type UsuarioParaAdmin = {
  id: string;
  nome: string;
  nickname: string;
  papel: "COLABORADOR" | "ADMIN";
  ativo: boolean;
  contaTeste: boolean;
  statusCadastro: "PENDENTE" | "APROVADO" | "REJEITADO";
  equipe: string;
  xpTotal: number;
  nivel: number;
  streakAtual: number;
  modulosConcluidosBasica: number;
  modulosConcluidosIntermediaria: number;
  precisaTrocarSenha: boolean;
  criadoEm: Date;
};

/**
 * Listagem com resumo de progresso, usada por GET /api/admin/usuarios e pela
 * página /admin/usuarios do frontend (Server Component).
 */
export async function obterUsuariosParaAdmin(): Promise<UsuarioParaAdmin[]> {
  const usuarios = await prisma.usuario.findMany({
    include: {
      equipe: { select: { nome: true } },
      progresso: { where: { concluido: true }, select: { trilha: true } },
    },
    orderBy: { criadoEm: "asc" },
  });

  return usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    nickname: u.nickname,
    papel: u.papel,
    ativo: u.ativo,
    contaTeste: u.contaTeste,
    statusCadastro: u.statusCadastro,
    equipe: u.equipe.nome,
    xpTotal: u.xpTotal,
    nivel: u.nivel,
    streakAtual: u.streakAtual,
    modulosConcluidosBasica: u.progresso.filter((p) => p.trilha === "basica").length,
    modulosConcluidosIntermediaria: u.progresso.filter((p) => p.trilha === "intermediaria").length,
    precisaTrocarSenha: u.precisaTrocarSenha,
    criadoEm: u.criadoEm,
  }));
}
