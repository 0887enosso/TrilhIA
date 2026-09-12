// Resgate de acesso administrativo, executado localmente contra o banco.
//
// Existe por causa de um impasse real: o reset de senha oficial
// (POST /api/admin/reset-password) exige estar logado COMO ADMIN para
// redefinir a senha de alguém. Isso funciona para destravar colaboradores,
// mas não para destravar o próprio admin — se a única conta de admin perde a
// senha, não há caminho nenhum dentro do app para voltar. Este script é esse
// caminho, e o acesso a ele é protegido pelo mesmo que protege o banco: só
// roda quem tem as credenciais do .env em mãos.
//
// Reaproveita `gerarSenhaTemporaria` e `gerarHashSenha` de src/lib/auth.ts em
// vez de reimplementar: a senha temporária precisa vir de `crypto.randomInt`
// (não de Math.random — ver docs/auditoria-tecnica-backend.md, item #5.1) e o
// hash precisa usar o mesmo custo de bcrypt do resto do sistema.
//
// Uso:  npx tsx scripts/resetar-senha-admin.ts [nickname]
//       (sem argumento, usa "admin")
import { PrismaClient } from "@prisma/client";
import { gerarHashSenha, gerarSenhaTemporaria } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const nickname = (process.argv[2] ?? "admin").trim().toLowerCase();

  const usuario = await prisma.usuario.findUnique({ where: { nickname } });
  if (!usuario) {
    throw new Error(`Nenhum usuário com nickname "${nickname}".`);
  }
  if (usuario.papel !== "ADMIN") {
    throw new Error(
      `"${nickname}" não é ADMIN. Este script é só para resgate de acesso administrativo — ` +
        `para redefinir a senha de um colaborador, use o painel (/admin/usuarios).`
    );
  }

  const senhaTemporaria = gerarSenhaTemporaria();
  const senhaHash = await gerarHashSenha(senhaTemporaria);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senhaHash,
      precisaTrocarSenha: true,
      // Mesmo efeito do reset oficial: invalida qualquer sessão que ainda
      // esteja aberta com a senha antiga (ver `senhaVersao` em src/lib/auth.ts).
      senhaAlteradaEm: new Date(),
      // Uma conta desativada ou pendente não consegue logar nem com a senha
      // certa; como o propósito aqui é justamente restaurar o acesso, o
      // resgate também reabre a conta.
      ativo: true,
      statusCadastro: "APROVADO",
    },
  });

  console.log("\n=== ACESSO ADMIN REDEFINIDO ===");
  console.log(`Nickname:         ${usuario.nickname}`);
  console.log(`Senha temporária: ${senhaTemporaria}`);
  console.log("\nO app vai exigir a troca desta senha no primeiro login.");
  console.log("Ela não fica salva em lugar nenhum além do hash — anote agora.\n");
}

main()
  .catch((erro) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
