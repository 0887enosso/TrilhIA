import { PrismaClient } from "@prisma/client";
import { gerarHashSenha, gerarSenhaTemporaria } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const equipes = ["Banco BMG", "Banco Pine", "C6 Bank"];

  for (const nome of equipes) {
    await prisma.equipe.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`Equipes seedadas: ${equipes.join(", ")}`);

  // Liga padrão de cada equipe — uma por equipe, sem condição de desbloqueio.
  const equipesCriadas = await prisma.equipe.findMany();
  for (const equipe of equipesCriadas) {
    await prisma.liga.upsert({
      where: { id: `liga-padrao-${equipe.id}` }, // placeholder determinístico só para o upsert não duplicar em reruns
      update: {},
      create: {
        id: `liga-padrao-${equipe.id}`,
        nome: `Liga ${equipe.nome}`,
        tipo: "PADRAO",
        equipeId: equipe.id,
      },
    });
  }
  console.log("Ligas padrão criadas (uma por equipe).");

  // Liga exclusiva de exemplo — só libera para quem concluiu a trilha básica.
  await prisma.liga.upsert({
    where: { id: "liga-exclusiva-trilha-basica" },
    update: {},
    create: {
      id: "liga-exclusiva-trilha-basica",
      nome: "Liga dos Letrados em IA",
      tipo: "EXCLUSIVA",
      equipeId: null,
      condicaoDesbloqueio: "trilha_basica_concluida",
    },
  });
  console.log("Liga exclusiva de exemplo criada.");

  // Admin inicial — nasce com senha temporária e precisaTrocarSenha = true,
  // seguindo o mesmo princípio de segurança do restante do sistema: nenhuma
  // senha em texto puro fica registrada em lugar nenhum além deste log local.
  const equipeDoAdmin = equipesCriadas[0];
  const nicknameAdmin = "admin";

  const adminExistente = await prisma.usuario.findUnique({
    where: { nickname: nicknameAdmin },
  });

  if (!adminExistente) {
    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await gerarHashSenha(senhaTemporaria);

    await prisma.usuario.create({
      data: {
        nome: "Administrador Inicial",
        nickname: nicknameAdmin,
        senhaHash,
        papel: "ADMIN",
        statusCadastro: "APROVADO", // admin inicial não passa pela fila de aprovação
        equipeId: equipeDoAdmin.id,
        precisaTrocarSenha: true,
      },
    });

    console.log("\n=== ADMIN INICIAL CRIADO ===");
    console.log(`Nickname: ${nicknameAdmin}`);
    console.log(`Senha temporária: ${senhaTemporaria}`);
    console.log("Guarde essa senha agora — ela não será exibida de novo.\n");
  } else {
    console.log("Admin inicial já existe, seed de usuário pulado.");
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
