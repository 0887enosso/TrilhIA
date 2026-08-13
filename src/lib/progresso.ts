import { cache } from "react";
import { prisma } from "./prisma";
import { listarIdsModulos, metadadosModulo, TrilhaId } from "./content";

const TRILHAS: TrilhaId[] = ["basica", "intermediaria"];

export type StatusModulo = "nao_iniciado" | "em_andamento" | "concluido";

/**
 * Progresso agregado do usuário nas duas trilhas — status de cada módulo, na
 * ordem do conteúdo. Usado por GET /api/progresso (uso externo/programático)
 * e diretamente pelas páginas do frontend (Server Components), para não
 * pagar uma volta HTTP extra só para ler o próprio banco.
 *
 * Em `cache()`: mais de um ponto na mesma página (ex: checar trava de trilha
 * e checar trava de módulo) pode precisar disso na mesma requisição.
 */
export const obterProgressoAgregado = cache(async (usuarioId: string) => {
  const registros = await prisma.progressoModulo.findMany({ where: { usuarioId } });
  const progressoPorModulo = new Map(registros.map((r) => [r.moduloId, r]));

  // A trilha básica é calculada primeiro (ela já vem antes na ordem de
  // TRILHAS) porque a intermediária depende do resultado dela: sem isso, o
  // primeiro módulo da intermediária aparecia sempre `desbloqueado: true`,
  // mesmo com a básica incompleta — o cálculo original só olhava os módulos
  // anteriores DENTRO da própria trilha, nunca a trava ENTRE trilhas.
  let trilhaBasicaConcluida = true;

  const entradas = TRILHAS.map((trilha) => {
    const modulosBase = listarIdsModulos(trilha).map((moduloId) => {
      const meta = metadadosModulo(trilha, moduloId);
      const registro = progressoPorModulo.get(moduloId);
      const status: StatusModulo = !registro
        ? "nao_iniciado"
        : registro.concluido
          ? "concluido"
          : "em_andamento";

      return { ...meta, status, concluidoEm: registro?.concluidoEm ?? null };
    });

    // Cada módulo só desbloqueia depois que TODOS os anteriores (na ordem
    // pedagógica) estiverem concluídos — o primeiro da trilha básica começa
    // sempre aberto; o primeiro da intermediária só se a básica inteira já
    // estiver concluída. `desbloqueado` não olha o próprio status do módulo,
    // só o dos que vêm antes dele (e, no caso da intermediária, da trilha
    // básica também).
    let anterioresConcluidos = trilha === "intermediaria" ? trilhaBasicaConcluida : true;
    const modulos = modulosBase.map((modulo) => {
      const comBloqueio = { ...modulo, desbloqueado: anterioresConcluidos };
      if (modulo.status !== "concluido") anterioresConcluidos = false;
      return comBloqueio;
    });

    const concluidos = modulos.filter((m) => m.status === "concluido").length;
    const trilhaFoiConcluida = concluidos === modulos.length;

    if (trilha === "basica") trilhaBasicaConcluida = trilhaFoiConcluida;

    return [
      trilha,
      {
        modulos,
        totalModulos: modulos.length,
        concluidos,
        trilhaConcluida: trilhaFoiConcluida,
      },
    ] as const;
  });

  return Object.fromEntries(entradas) as Record<TrilhaId, (typeof entradas)[number][1]>;
});
