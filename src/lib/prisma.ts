import { PrismaClient } from "@prisma/client";

// Em desenvolvimento, o Next.js recarrega módulos a cada mudança de arquivo.
// Sem esse cache global, cada reload criaria uma nova conexão com o banco,
// esgotando rápido o limite de conexões do Supabase.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
