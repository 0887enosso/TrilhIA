import { prisma } from "./prisma";
import { listarIdsModulos, metadadosModulo, TrilhaId } from "./content";

const TRILHAS: TrilhaId[] = ["basica", "intermediaria"];

export type StatusModulo = "nao_iniciado" | "em_andamento" | "concluido";

/**
 * Progresso agregado do usuário nas duas trilhas — status de cada módulo, na
 * ordem do conteúdo. Usado por GET /api/progresso (uso externo/programático)
 * e diretamente pelas páginas do frontend (Server Components), para não
 * pagar uma volta HTTP extra só para ler o próprio banco.
 */
export async function obterProgressoAgregado(usuarioId: string) {
  const registros = await prisma.progressoModulo.findMany({ where: { usuarioId } });
  const progressoPorModulo = new Map(registros.map((r) => [r.moduloId, r]));

  const entradas = TRILHAS.map((trilha) => {
    const modulos = listarIdsModulos(trilha).map((moduloId) => {
      const meta = metadadosModulo(trilha, moduloId);
      const registro = progressoPorModulo.get(moduloId);
      const status: StatusModulo = !registro
        ? "nao_iniciado"
        : registro.concluido
          ? "concluido"
          : "em_andamento";

      return { ...meta, status, concluidoEm: registro?.concluidoEm ?? null };
    });

    const concluidos = modulos.filter((m) => m.status === "concluido").length;

    return [
      trilha,
      {
        modulos,
        totalModulos: modulos.length,
        concluidos,
        trilhaConcluida: concluidos === modulos.length,
      },
    ] as const;
  });

  return Object.fromEntries(entradas) as Record<TrilhaId, (typeof entradas)[number][1]>;
}
