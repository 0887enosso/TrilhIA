import { prisma } from "./prisma";

/** Quantos módulos NOVOS um usuário pode iniciar por dia. */
export const LIMITE_MODULOS_POR_DIA = 2;

function inicioDoDiaUTC(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

export type ResultadoTentativaEstrela = {
  permitido: boolean;
  modulosRestantesHoje: number;
};

/**
 * Tenta reservar uma "estrela diária" para iniciar um módulo novo. Só deve
 * ser chamada quando o módulo é genuinamente novo para o usuário (sem
 * ProgressoModulo prévio) — reabrir um módulo já iniciado é sempre de graça
 * e não passa por aqui.
 *
 * Implementado em duas atualizações atômicas (não um read-then-write) para
 * ser seguro sob concorrência: mesmo que duas requisições cheguem quase
 * juntas, o WHERE de cada updateMany é reavaliado pelo banco no momento da
 * escrita, então só uma delas consegue incrementar quando resta 1 vaga.
 */
export async function tentarConsumirEstrelaDiaria(
  usuarioId: string
): Promise<ResultadoTentativaEstrela> {
  const hoje = inicioDoDiaUTC(new Date());

  // Passo 1: se o contador é de um dia anterior (ou nunca foi usado), zera
  // para hoje. Idempotente — não tem problema rodar isso toda vez.
  await prisma.usuario.updateMany({
    where: {
      id: usuarioId,
      OR: [{ dataUltimoModuloIniciado: null }, { dataUltimoModuloIniciado: { lt: hoje } }],
    },
    data: { modulosIniciadosHoje: 0, dataUltimoModuloIniciado: hoje },
  });

  // Passo 2: só incrementa se ainda houver vaga hoje — condição e escrita no
  // mesmo UPDATE, atômico ao nível do banco.
  const resultado = await prisma.usuario.updateMany({
    where: {
      id: usuarioId,
      dataUltimoModuloIniciado: hoje,
      modulosIniciadosHoje: { lt: LIMITE_MODULOS_POR_DIA },
    },
    data: { modulosIniciadosHoje: { increment: 1 } },
  });

  const usuarioAtual = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });

  return {
    permitido: resultado.count === 1,
    modulosRestantesHoje: Math.max(
      0,
      LIMITE_MODULOS_POR_DIA - usuarioAtual.modulosIniciadosHoje
    ),
  };
}

/** Só para exibição (ex: tela inicial) — não reserva nada, apenas informa o estado atual. */
export async function estrelasRestantesHoje(usuarioId: string): Promise<number> {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  const hoje = inicioDoDiaUTC(new Date());

  const contadorEhDeHoje =
    usuario.dataUltimoModuloIniciado &&
    inicioDoDiaUTC(usuario.dataUltimoModuloIniciado).getTime() === hoje.getTime();

  const usados = contadorEhDeHoje ? usuario.modulosIniciadosHoje : 0;
  return Math.max(0, LIMITE_MODULOS_POR_DIA - usados);
}
