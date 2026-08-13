import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  carregarModulo,
  carregarTransicaoBasicaParaIntermediaria,
  listarIdsModulos,
  TrilhaId,
} from "./content";

/** Cliente Prisma "normal" ou um cliente de transação (`tx` de `prisma.$transaction`) — mesma API para as duas coisas. */
type PrismaOuTransacao = typeof prisma | Prisma.TransactionClient;

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
    }
  }

  return resultado;
}
