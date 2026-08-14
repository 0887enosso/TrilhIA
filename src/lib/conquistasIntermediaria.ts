import { listarIdsModulos } from "./content";
import { concederConquista, type PrismaOuTransacao } from "./conquistas";

const BLOCOS_INTERMEDIARIA: Record<string, string[]> = {
  A: ["intermediaria-01", "intermediaria-02", "intermediaria-03", "intermediaria-04", "intermediaria-05", "intermediaria-06"],
  B: ["intermediaria-07", "intermediaria-08", "intermediaria-09", "intermediaria-10", "intermediaria-11", "intermediaria-12"],
  C: ["intermediaria-13", "intermediaria-14", "intermediaria-15", "intermediaria-16", "intermediaria-17"],
  D: ["intermediaria-18", "intermediaria-19", "intermediaria-20", "intermediaria-21", "intermediaria-22", "intermediaria-23"],
  E: ["intermediaria-24", "intermediaria-25", "intermediaria-26", "intermediaria-27", "intermediaria-28", "intermediaria-29"],
};

const CASOS_PARA_BADGE: Record<string, { badgeId: string; nome: string; descricao: string }> = {
  "caso-1-revisao-contratual": {
    badgeId: "negociador-de-clausulas",
    nome: "Negociador de Cláusulas",
    descricao: "Concluiu o projeto final aplicando IA à revisão de um contrato e à identificação de riscos.",
  },
  "caso-2-due-diligence": {
    badgeId: "investigador-de-bastidores",
    nome: "Investigador de Bastidores",
    descricao: "Concluiu o projeto final aplicando IA a uma due diligence simplificada.",
  },
  "caso-3-peca-processual": {
    badgeId: "redator-de-peticao",
    nome: "Redator de Petição",
    descricao: "Concluiu o projeto final aplicando IA à preparação de uma peça processual.",
  },
};

const N_DIAS_ENTREGA_MIN_CARACTERES = 40;
const MAX_HIATO_MS_SEM_PERDER_O_RITMO = 7 * 24 * 60 * 60 * 1000;
const N_PIONEIRO_DA_EQUIPE = 3;
const MAX_DIAS_SPRINT_DA_TRILHA = 20;

/**
 * Emblemas e troféus da Trilha Intermediária que não são os 6 badges
 * estruturais já existentes (uma por bloco + "Mestre em IA Aplicada",
 * concedidos por código já presente em `processarConquistasDoModulo`).
 * Chamada a partir de lá sempre que um módulo da intermediária é concluído.
 */
export async function processarConquistasIntermediaria(
  usuarioId: string,
  moduloId: string,
  db: PrismaOuTransacao
): Promise<void> {
  if (moduloId === "intermediaria-15") {
    await concederConquista(
      db,
      usuarioId,
      "metade-do-prazo",
      "Metade do Prazo",
      "Chegou à metade da Trilha Intermediária — 15 de 30 módulos concluídos."
    );
  }

  if (moduloId === "intermediaria-18") {
    await concederConquista(
      db,
      usuarioId,
      "perito-assistente",
      "Perito Assistente",
      "Entrou no território técnico da trilha — começou o Bloco D."
    );
  }

  // Generalista de Confiança: ao menos 1 módulo sem erro em cada um dos 5 blocos.
  const blocoDoModulo = Object.keys(BLOCOS_INTERMEDIARIA).find((bloco) =>
    BLOCOS_INTERMEDIARIA[bloco].includes(moduloId)
  );
  if (blocoDoModulo) {
    let temModuloLimpoEmTodosOsBlocos = true;
    for (const modulosDoBloco of Object.values(BLOCOS_INTERMEDIARIA)) {
      const concluidosNoBloco = await db.progressoModulo.findMany({
        where: { usuarioId, trilha: "intermediaria", moduloId: { in: modulosDoBloco }, concluido: true },
        select: { moduloId: true },
      });
      if (concluidosNoBloco.length === 0) {
        temModuloLimpoEmTodosOsBlocos = false;
        break;
      }
      let algumModuloLimpo = false;
      for (const { moduloId: idConcluido } of concluidosNoBloco) {
        const erros = await db.respostaQuestao.count({
          where: { usuarioId, moduloId: idConcluido, correta: false },
        });
        if (erros === 0) {
          algumModuloLimpo = true;
          break;
        }
      }
      if (!algumModuloLimpo) {
        temModuloLimpoEmTodosOsBlocos = false;
        break;
      }
    }
    if (temModuloLimpoEmTodosOsBlocos) {
      await concederConquista(
        db,
        usuarioId,
        "generalista-de-confianca",
        "Generalista de Confiança",
        "Mostrou domínio em pelo menos um módulo de cada bloco da trilha, sem nenhuma resposta errada."
      );
    }
  }

  // Sem Perder o Ritmo: nenhum hiato >7 dias corridos entre conclusões, do
  // 1º ao 30º módulo — só avaliado quando a trilha inteira está concluída.
  const idsIntermediaria = listarIdsModulos("intermediaria");
  const progresso = await db.progressoModulo.findMany({
    where: { usuarioId, trilha: "intermediaria", moduloId: { in: idsIntermediaria }, concluido: true },
    select: { concluidoEm: true, criadoEm: true },
    orderBy: { criadoEm: "asc" },
  });
  if (progresso.length === idsIntermediaria.length) {
    const concluidosEm = progresso.map((p) => p.concluidoEm).filter((d): d is Date => d !== null);
    if (concluidosEm.length === idsIntermediaria.length) {
      const ordenadas = [...concluidosEm].sort((a, b) => a.getTime() - b.getTime());
      let maiorHiato = 0;
      for (let i = 1; i < ordenadas.length; i++) {
        const hiato = ordenadas[i].getTime() - ordenadas[i - 1].getTime();
        if (hiato > maiorHiato) maiorHiato = hiato;
      }
      if (maiorHiato <= MAX_HIATO_MS_SEM_PERDER_O_RITMO) {
        await concederConquista(
          db,
          usuarioId,
          "sem-perder-o-ritmo",
          "Sem Perder o Ritmo",
          "Concluiu a Trilha Intermediária mantendo constância — sem ficar muito tempo parado."
        );
      }
    }
  }

  // Os itens abaixo só fazem sentido no momento em que o módulo 30 é
  // concluído — é ali que o certificado da trilha é emitido.
  if (moduloId === "intermediaria-30") {
    await processarConclusaoIntermediaria(usuarioId, db, idsIntermediaria);
  }
}

async function processarConclusaoIntermediaria(
  usuarioId: string,
  db: PrismaOuTransacao,
  idsIntermediaria: string[]
): Promise<void> {
  // Emblemas por caso do projeto final — depende da trava de segurança em
  // POST /api/progresso/projeto-final que impede trocar de caso depois de
  // já concluído (sem ela, dava pra colecionar os 3 badges sem esforço).
  const entrega = await db.entregaProjetoFinal.findUnique({
    where: { usuarioId_moduloId: { usuarioId, moduloId: "intermediaria-30" } },
  });
  if (entrega) {
    const badgeInfo = CASOS_PARA_BADGE[entrega.casoId];
    if (badgeInfo) {
      await concederConquista(db, usuarioId, badgeInfo.badgeId, badgeInfo.nome, badgeInfo.descricao);
    }

    // Entrega Impecável: checklist 100% marcado + respostas com conteúdo real
    // (não só autoavaliação subjetiva — sem isso, dava pra marcar tudo certo
    // sem escrever nada de verdade).
    const checklist = Array.isArray(entrega.checklistMarcado) ? (entrega.checklistMarcado as unknown[]) : [];
    const respostas = Array.isArray(entrega.respostasTarefas) ? (entrega.respostasTarefas as unknown[]) : [];
    const checklistCompleto = checklist.length > 0 && checklist.every((item) => item === true);
    const respostasComConteudo =
      respostas.length > 0 &&
      respostas.every((r) => typeof r === "string" && r.trim().length >= N_DIAS_ENTREGA_MIN_CARACTERES);
    if (checklistCompleto && respostasComConteudo) {
      await concederConquista(
        db,
        usuarioId,
        "entrega-impecavel",
        "Entrega Impecável",
        "Checklist de autoavaliação 100% marcado no projeto final — com respostas de verdade em cada tarefa, não só caixinhas marcadas.",
        "TROFEU"
      );
    }
  }

  // Toga de Ouro: emitido junto do certificado da trilha (a trava de acesso
  // sequencial já garante as 6 badges estruturais anteriores).
  await concederConquista(
    db,
    usuarioId,
    "toga-de-ouro",
    "Toga de Ouro",
    "A trilha completa, do primeiro módulo ao projeto final — e todas as 7 conquistas do caminho reunidas em uma só.",
    "TROFEU"
  );

  // Impecável: zero erros em toda a trilha intermediária.
  const errosTotal = await db.respostaQuestao.count({
    where: { usuarioId, moduloId: { in: idsIntermediaria }, correta: false },
  });
  if (errosTotal === 0) {
    await concederConquista(
      db,
      usuarioId,
      "impecavel-trilha-intermediaria",
      "Impecável",
      "Você percorreu a Trilha Intermediária inteira sem errar uma única questão.",
      "TROFEU"
    );
  }

  // Pioneiro da Equipe: entre os 3 primeiros certificados de intermediária
  // dentro da própria equipe (não do escritório inteiro).
  const usuario = await db.usuario.findUnique({ where: { id: usuarioId }, select: { equipeId: true } });
  if (usuario) {
    const outrosCertificadosDaEquipe = await db.certificado.count({
      where: {
        trilha: "intermediaria",
        usuarioId: { not: usuarioId },
        usuario: { equipeId: usuario.equipeId },
      },
    });
    if (outrosCertificadosDaEquipe < N_PIONEIRO_DA_EQUIPE) {
      await concederConquista(
        db,
        usuarioId,
        "pioneiro-da-equipe",
        "Pioneiro da Equipe",
        "Entre os 3 primeiros da sua equipe a concluir a Trilha Intermediária inteira.",
        "TROFEU"
      );
    }
  }

  // Sprint da Trilha: ≤20 dias corridos entre o início do 1º módulo e a
  // emissão do certificado (concedido logo em seguida a este ponto).
  const primeiroModulo = await db.progressoModulo.findUnique({
    where: { usuarioId_moduloId: { usuarioId, moduloId: "intermediaria-01" } },
    select: { criadoEm: true },
  });
  if (primeiroModulo) {
    const diasCorridos = (Date.now() - primeiroModulo.criadoEm.getTime()) / (24 * 60 * 60 * 1000);
    if (diasCorridos <= MAX_DIAS_SPRINT_DA_TRILHA) {
      await concederConquista(
        db,
        usuarioId,
        "sprint-da-trilha",
        "Sprint da Trilha",
        "Trilha Intermediária concluída em até 20 dias corridos, do primeiro módulo ao projeto final.",
        "TROFEU"
      );
    }
  }
}
