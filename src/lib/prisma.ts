import { PrismaClient } from "@prisma/client";

// Em desenvolvimento, o Next.js recarrega módulos a cada mudança de arquivo.
// Sem esse cache global, cada reload criaria uma nova conexão com o banco,
// esgotando rápido o limite de conexões do Supabase.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * `LOG_QUERIES=1` liga o log de cada consulta com o tempo que ela levou, e
 * um contador por requisição no fim. Serve para responder a pergunta que a
 * lentidão relatada exige: não "esta consulta é lenta?", mas "quantas idas
 * ao banco esta ação faz?". Com o banco remoto, o custo é dominado pelo
 * NÚMERO de idas, não pelo peso de cada uma — cada round-trip custa o mesmo
 * piso de rede, seja um SELECT 1 ou um join.
 *
 * Fica desligado por padrão: em produção esse volume de log seria ruído.
 */
function criarCliente(): PrismaClient {
  if (process.env.LOG_QUERIES !== "1") return new PrismaClient();

  const cliente = new PrismaClient({
    log: [{ emit: "event", level: "query" }],
  });

  let total = 0;
  let acumulado = 0;
  let timer: NodeJS.Timeout | undefined;

  cliente.$on("query", (evento) => {
    total += 1;
    acumulado += evento.duration;
    const resumo = evento.query.replace(/\s+/g, " ").slice(0, 90);
    console.log(`[sql ${String(total).padStart(3)}] ${String(evento.duration).padStart(4)}ms  ${resumo}`);

    // Sem hook de "fim de requisição" aqui, o fechamento é por silêncio:
    // 400ms sem nenhuma consulta nova indica que a ação terminou.
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(
        `[sql] ===== ${total} consultas nesta acao, ${acumulado}ms somados no banco =====\n`
      );
      total = 0;
      acumulado = 0;
    }, 400);
  });

  return cliente;
}

export const prisma = globalForPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
