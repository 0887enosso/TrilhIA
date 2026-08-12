import { prisma } from "./prisma";

/**
 * Rate limiting simples baseado em banco (sem dependência externa tipo
 * Redis) — suficiente para o volume esperado de uso interno do escritório.
 * Se o tráfego crescer muito, vale migrar para algo como Upstash Redis, mas
 * não é necessário agora.
 */

export type TipoTentativa = "login" | "register";

const LIMITES: Record<TipoTentativa, { janelaMinutos: number; maxTentativas: number }> = {
  login: { janelaMinutos: 15, maxTentativas: 5 },
  register: { janelaMinutos: 60, maxTentativas: 10 },
};

export async function dentroDoLimite(
  identificador: string,
  tipo: TipoTentativa
): Promise<boolean> {
  const { janelaMinutos, maxTentativas } = LIMITES[tipo];
  const desde = new Date(Date.now() - janelaMinutos * 60 * 1000);

  const tentativas = await prisma.tentativaAcesso.count({
    where: { identificador, tipo, criadoEm: { gte: desde } },
  });

  return tentativas < maxTentativas;
}

export async function registrarTentativa(
  identificador: string,
  tipo: TipoTentativa
): Promise<void> {
  await prisma.tentativaAcesso.create({ data: { identificador, tipo } });
}

/** Extrai um identificador de IP da requisição, com fallback para ambientes sem proxy (dev local). */
export function obterIpDaRequisicao(request: Request): string {
  const encaminhadoPor = request.headers.get("x-forwarded-for");
  if (encaminhadoPor) return encaminhadoPor.split(",")[0].trim();
  return "desconhecido";
}
