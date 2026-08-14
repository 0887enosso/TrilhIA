import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  carregarModulo,
  carregarTransicaoBasicaParaIntermediaria,
  listarIdsModulos,
  TrilhaId,
} from "./content";
import { EMBLEMAS_BADGE_IDS, TRIBUNAL_PLENO_BADGE_ID, TRIBUNAL_PLENO_PERCENTUAL_MINIMO } from "./catalogoConquistas";
import { processarConquistasBasica } from "./conquistasBasica";
import { processarConquistasIntermediaria } from "./conquistasIntermediaria";

/** Cliente Prisma "normal" ou um cliente de transação (`tx` de `prisma.$transaction`) — mesma API para as duas coisas. */
export type PrismaOuTransacao = typeof prisma | Prisma.TransactionClient;

function paraSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function concederBadge(
  db: PrismaOuTransacao,
  usuarioId: string,
  nomeBadge: string,
  descricao: string
): Promise<string> {
  const badgeId = paraSlug(nomeBadge);
  await db.conquistaUsuario.upsert({
    where: { usuarioId_badgeId: { usuarioId, badgeId } },
    update: {},
    create: { usuarioId, badgeId, nomeBadge, descricao },
  });
  return badgeId;
}

/**
 * Concede um emblema ou troféu do catálogo novo (ver docs/gamificacao.md) —
 * ao contrário de `concederBadge` (usado só pelas 7 badges estruturais já
 * existentes antes desta rodada), aqui a chave é sempre passada
 * explicitamente, nunca derivada do nome de exibição. Isso evita o problema
 * já conhecido de `concederBadge`: se o nome mudar depois, o slug muda
 * junto e quebra a unicidade com o que já foi concedido.
 *
 * `upsert` com `update: {}` é idempotente de propósito — chamar de novo pra
 * uma conquista já concedida não é erro, só um no-op (é assim que a maioria
 * dos critérios "só uma vez" é garantida, sem precisar rastrear "já
 * concedi?" em código).
 *
 * Emblemas frescos disparam a checagem de "Tribunal Pleno" (troféu
 * colecionador) — chamada aqui dentro, não em cada domínio separadamente,
 * pra não esquecer de checar em algum lugar novo no futuro.
 */
export async function concederConquista(
  db: PrismaOuTransacao,
  usuarioId: string,
  badgeId: string,
  nomeBadge: string,
  descricao: string,
  tipo: "EMBLEMA" | "TROFEU" = "EMBLEMA"
): Promise<void> {
  await db.conquistaUsuario.upsert({
    where: { usuarioId_badgeId: { usuarioId, badgeId } },
    update: {},
    create: { usuarioId, badgeId, nomeBadge, descricao, tipo },
  });

  if (tipo === "EMBLEMA") {
    await verificarTribunalPleno(db, usuarioId);
  }
}

/**
 * Troféu "colecionador": concede quando o usuário já tem pelo menos 80% de
 * todos os emblemas do catálogo (`EMBLEMAS_BADGE_IDS`) — troféus não contam
 * pra essa conta, pra não virar um alvo móvel. Chamada automaticamente por
 * `concederConquista` sempre que um emblema novo é concedido; seguro chamar
 * repetidamente (idempotente via upsert).
 */
async function verificarTribunalPleno(db: PrismaOuTransacao, usuarioId: string): Promise<void> {
  const conquistados = await db.conquistaUsuario.count({
    where: { usuarioId, tipo: "EMBLEMA", badgeId: { in: [...EMBLEMAS_BADGE_IDS] } },
  });

  if (conquistados / EMBLEMAS_BADGE_IDS.length >= TRIBUNAL_PLENO_PERCENTUAL_MINIMO) {
    await db.conquistaUsuario.upsert({
      where: { usuarioId_badgeId: { usuarioId, badgeId: TRIBUNAL_PLENO_BADGE_ID } },
      update: {},
      create: {
        usuarioId,
        badgeId: TRIBUNAL_PLENO_BADGE_ID,
        nomeBadge: "Tribunal Pleno",
        descricao:
          "Reuniu pelo menos 80% de todas as conquistas menores do TrilhIA — quando o plenário se forma, poucos ficam de fora.",
        tipo: "TROFEU",
      },
    });
  }
}

/**
 * Troféus "Ficha Limpa" (Maestria) e "Doutor(a) em IA" (Maestria) dependem
 * dos 2 certificados — checados aqui, logo após qualquer emissão de
 * certificado (as únicas 2 vezes que o conjunto de certificados do usuário
 * pode ter acabado de completar as duas trilhas).
 */
async function verificarFichaLimpaEDoutorEmIA(db: PrismaOuTransacao, usuarioId: string): Promise<void> {
  const totalCertificados = await db.certificado.count({ where: { usuarioId } });
  if (totalCertificados < 2) return;

  const errosTotal = await db.respostaQuestao.count({ where: { usuarioId, correta: false } });
  if (errosTotal === 0) {
    await concederConquista(
      db,
      usuarioId,
      "ficha-limpa",
      "Ficha Limpa",
      "Concluiu as trilhas Básica e Intermediária inteiras sem nunca errar uma única questão — nenhuma mancha no seu histórico.",
      "TROFEU"
    );
  }

  await verificarDoutorEmIA(db, usuarioId);
}

/**
 * Doutor(a) em IA (Maestria) — as duas trilhas concluídas + nível ≥20.
 * Exportada porque as duas condições mudam em momentos diferentes: os
 * certificados aqui (`verificarFichaLimpaEDoutorEmIA`, ao concluir módulo)
 * e o nível em `processarConquistasDeNivel`
 * (src/lib/conquistasMaestria.ts, ao responder questão) — cada gatilho
 * revalida a condição inteira, não só a metade que mudou.
 */
export async function verificarDoutorEmIA(db: PrismaOuTransacao, usuarioId: string): Promise<void> {
  const [totalCertificados, usuario] = await Promise.all([
    db.certificado.count({ where: { usuarioId } }),
    db.usuario.findUnique({ where: { id: usuarioId }, select: { nivel: true } }),
  ]);

  if (totalCertificados >= 2 && (usuario?.nivel ?? 0) >= 20) {
    await concederConquista(
      db,
      usuarioId,
      "doutor-em-ia",
      "Doutor(a) em IA",
      "Concluiu as duas trilhas e seguiu estudando muito além do currículo — título reservado a quem transforma conhecimento em hábito duradouro.",
      "TROFEU"
    );
  }
}

async function emitirCertificado(
  db: PrismaOuTransacao,
  usuarioId: string,
  trilha: TrilhaId
): Promise<void> {
  await db.certificado.upsert({
    where: { usuarioId_trilha: { usuarioId, trilha } },
    update: {},
    create: { usuarioId, trilha },
  });
}

type ResultadoConquistas = {
  badgesGanhas: string[];
  certificadoEmitido: boolean;
};

export type DadosCertificado = {
  titulo: string;
  texto: string;
};

/**
 * Monta o texto de exibição de um certificado já emitido, substituindo
 * {nome_do_usuario} pelo nome real. O texto-base de cada trilha vive em
 * lugares diferentes no conteúdo por não terem a mesma origem: a Trilha
 * Básica não tem um "módulo 30" equivalente, então seu certificado é
 * definido no arquivo de transição entre trilhas; o da Intermediária vive no
 * campo conquista_final do próprio módulo 30.
 */
export function obterDadosCertificado(trilha: TrilhaId, nomeUsuario: string): DadosCertificado {
  const certificado =
    trilha === "basica"
      ? carregarTransicaoBasicaParaIntermediaria().tela_celebracao.certificado
      : carregarModulo("intermediaria", "intermediaria-30").conquista_final;

  return {
    titulo: certificado.titulo_certificado,
    texto: (certificado.texto_base ?? certificado.texto_base_certificado).replace(
      "{nome_do_usuario}",
      nomeUsuario
    ),
  };
}

export type BadgeConquistada = {
  badgeId: string;
  nomeBadge: string;
  descricao: string;
  conquistadoEm: Date;
};

export type CertificadoEmitido = DadosCertificado & {
  trilha: TrilhaId;
  emitidoEm: Date;
};

/**
 * Badges e certificados do usuário, com o texto de exibição do certificado
 * já resolvido. Usado por GET /api/conquistas e diretamente pela página de
 * conquistas do frontend (Server Component).
 */
export async function obterConquistasDoUsuario(
  usuarioId: string
): Promise<{ badges: BadgeConquistada[]; certificados: CertificadoEmitido[] }> {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { nome: true },
  });

  const [badges, certificadosRegistrados] = await Promise.all([
    prisma.conquistaUsuario.findMany({
      where: { usuarioId },
      orderBy: { conquistadoEm: "asc" },
    }),
    prisma.certificado.findMany({
      where: { usuarioId },
      orderBy: { emitidoEm: "asc" },
    }),
  ]);

  const certificados = certificadosRegistrados.map((certificado) => {
    const dados = obterDadosCertificado(certificado.trilha as TrilhaId, usuario.nome);
    return { ...dados, trilha: certificado.trilha as TrilhaId, emitidoEm: certificado.emitidoEm };
  });

  return {
    badges: badges.map((b) => ({
      badgeId: b.badgeId,
      nomeBadge: b.nomeBadge,
      descricao: b.descricao,
      conquistadoEm: b.conquistadoEm,
    })),
    certificados,
  };
}

/**
 * Chamada sempre que um módulo é marcado como concluído. Verifica, nesta
 * ordem: badge de fim de bloco (campo conquista_de_bloco no módulo), badge +
 * certificado de fim de trilha intermediária (campo conquista_final, só
 * existe no módulo 30), e conclusão total da trilha básica (verificada por
 * contagem, já que ela não tem um "módulo 30" equivalente).
 *
 * Aceita opcionalmente o client de transação (`tx`) de um
 * `prisma.$transaction(...)` em vez do client global — assim quem chama pode
 * garantir que marcar o módulo como concluído e conceder badge/certificado
 * acontecem atomicamente. Sem o parâmetro, usa o client global normalmente
 * (compatível com quem já chama esta função fora de uma transação).
 */
export async function processarConquistasDoModulo(
  usuarioId: string,
  trilha: TrilhaId,
  moduloId: string,
  db: PrismaOuTransacao = prisma
): Promise<ResultadoConquistas> {
  const modulo = carregarModulo(trilha, moduloId);
  const resultado: ResultadoConquistas = { badgesGanhas: [], certificadoEmitido: false };

  // Parecer Sem Ressalvas (Maestria) — cross-trilha: concluiu ESTE módulo
  // sem nenhuma resposta errada registrada. Independente do resto da
  // função (não é estrutural nem de bloco), por isso avaliado logo aqui.
  const errosNesteModulo = await db.respostaQuestao.count({
    where: { usuarioId, moduloId, correta: false },
  });
  if (errosNesteModulo === 0) {
    await concederConquista(
      db,
      usuarioId,
      "parecer-sem-ressalvas",
      "Parecer Sem Ressalvas",
      "Concluiu um módulo sem nenhuma resposta errada."
    );
  }

  if (modulo.conquista_de_bloco) {
    const badgeId = await concederBadge(
      db,
      usuarioId,
      modulo.conquista_de_bloco.nome_badge,
      modulo.conquista_de_bloco.descricao
    );
    resultado.badgesGanhas.push(badgeId);
  }

  if (modulo.conquista_final) {
    const badgeId = await concederBadge(
      db,
      usuarioId,
      modulo.conquista_final.nome_badge,
      modulo.conquista_final.descricao
    );
    resultado.badgesGanhas.push(badgeId);

    if (modulo.conquista_final.certificado_elegivel) {
      await emitirCertificado(db, usuarioId, trilha);
      resultado.certificadoEmitido = true;
      await verificarFichaLimpaEDoutorEmIA(db, usuarioId);
    }
  }

  if (trilha === "basica") {
    const idsBasica = listarIdsModulos("basica");
    const concluidos = await db.progressoModulo.count({
      where: { usuarioId, trilha: "basica", moduloId: { in: idsBasica }, concluido: true },
    });

    if (concluidos === idsBasica.length) {
      const transicao = carregarTransicaoBasicaParaIntermediaria();
      const badgeInfo = transicao.tela_celebracao.badge_conquistada;
      const badgeId = await concederBadge(db, usuarioId, badgeInfo.nome, badgeInfo.descricao);
      resultado.badgesGanhas.push(badgeId);

      await emitirCertificado(db, usuarioId, "basica");
      resultado.certificadoEmitido = true;
      await verificarFichaLimpaEDoutorEmIA(db, usuarioId);
    }

    await processarConquistasBasica(usuarioId, moduloId, db);
  }

  if (trilha === "intermediaria") {
    await processarConquistasIntermediaria(usuarioId, moduloId, db);
  }

  return resultado;
}
