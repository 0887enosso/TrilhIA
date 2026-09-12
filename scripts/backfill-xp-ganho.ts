// Backfill único de ProgressoModulo.xpGanho — campo existia no schema desde
// a Fase 2 e nunca foi preenchido (ver docs/auditoria-tecnica-backend.md,
// item #4). A partir de agora POST /api/progresso/questao/responder mantém
// esse campo atualizado a cada questão respondida; este script só acerta o
// histórico já gravado antes dessa correção, recalculando cada valor a
// partir da fonte de verdade (XpConcedido) em vez de tentar reconstruir a
// partir de outra coisa. Idempotente por design (usa `set` com o valor
// recalculado do zero, não `increment`) — rodar de novo não duplica nada,
// então não é um problema deixar este script no repositório como registro
// do que foi feito (mesmo espírito de scripts/migrar_schema_conteudo.py).
//
// Uso: npx tsx scripts/backfill-xp-ganho.ts
import { PrismaClient } from "@prisma/client";
import { parseQuestaoId } from "../src/lib/content";

const prisma = new PrismaClient();

async function main() {
  const [progressos, concessoes] = await Promise.all([
    prisma.progressoModulo.findMany({ select: { id: true, usuarioId: true, moduloId: true, xpGanho: true } }),
    prisma.xpConcedido.findMany({ select: { usuarioId: true, questaoId: true, xp: true } }),
  ]);

  const somaPorUsuarioEModulo = new Map<string, number>();
  for (const concessao of concessoes) {
    const { moduloId } = parseQuestaoId(concessao.questaoId);
    const chave = `${concessao.usuarioId}:${moduloId}`;
    somaPorUsuarioEModulo.set(chave, (somaPorUsuarioEModulo.get(chave) ?? 0) + concessao.xp);
  }

  let atualizados = 0;
  for (const progresso of progressos) {
    const valorCorreto = somaPorUsuarioEModulo.get(`${progresso.usuarioId}:${progresso.moduloId}`) ?? 0;
    if (valorCorreto === progresso.xpGanho) continue;

    await prisma.progressoModulo.update({
      where: { id: progresso.id },
      data: { xpGanho: valorCorreto },
    });
    atualizados++;
    console.log(`usuario=${progresso.usuarioId} modulo=${progresso.moduloId}: ${progresso.xpGanho} -> ${valorCorreto}`);
  }

  console.log(`\n${atualizados} de ${progressos.length} registros de progresso atualizados.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
