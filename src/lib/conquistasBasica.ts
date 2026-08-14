import { listarIdsModulos } from "./content";
import { concederConquista, type PrismaOuTransacao } from "./conquistas";

/** Eixo temático de pensamento crítico plantado na Trilha Básica: módulo 2
 * planta o tema, módulo 8 aprofunda (alucinação), módulo 10 fecha (uso
 * responsável) — ver "Olho Clínico" abaixo. */
const MODULOS_EIXO_CRITICO = ["basica-02", "basica-08", "basica-10"];

const N_PRIMEIRA_TURMA_OAB = 20;
const MAX_DIAS_SENTENCA_PRIMEIRA_INSTANCIA = 5;
const MIN_TAXA_ACERTO_SENTENCA_PRIMEIRA_INSTANCIA = 0.9;
const MAX_HIATO_MS_SEM_PERDER_O_PRAZO = 72 * 60 * 60 * 1000;

/**
 * Emblemas e troféus da Trilha Básica que não são os 1 badge estrutural já
 * existente ("Letrado em IA", concedido por código já presente em
 * `processarConquistasDoModulo`). Chamada a partir de lá sempre que um
 * módulo da básica é concluído (idempotente — seguro chamar de novo em
 * re-tentativas). Ver docs/gamificacao.md para os critérios completos.
 */
export async function processarConquistasBasica(
  usuarioId: string,
  moduloId: string,
  db: PrismaOuTransacao
): Promise<void> {
  if (moduloId === "basica-01") {
    await concederConquista(
      db,
      usuarioId,
      "primeiro-protocolo",
      "Primeiro Protocolo",
      "Você abriu seu processo de letramento em IA — primeiro módulo concluído."
    );
  }

  if (moduloId === "basica-05") {
    await concederConquista(
      db,
      usuarioId,
      "metade-do-caminho",
      "Metade do Caminho",
      "Você já venceu metade da Trilha Básica."
    );
  }

  if (moduloId === "basica-06") {
    await concederConquista(
      db,
      usuarioId,
      "boa-pergunta-boa-resposta",
      "Boa Pergunta, Boa Resposta",
      "Você aprendeu a se comunicar bem com a IA e a construir o prompt certo."
    );
  }

  if (moduloId === "basica-09") {
    await concederConquista(
      db,
      usuarioId,
      "guardiao-da-informacao",
      "Guardião da Informação",
      "Você entendeu como proteger sigilo e dados sensíveis ao usar IA no dia a dia jurídico."
    );
  }

  if (MODULOS_EIXO_CRITICO.includes(moduloId)) {
    const concluidosEixo = await db.progressoModulo.count({
      where: { usuarioId, trilha: "basica", moduloId: { in: MODULOS_EIXO_CRITICO }, concluido: true },
    });
    if (concluidosEixo === MODULOS_EIXO_CRITICO.length) {
      await concederConquista(
        db,
        usuarioId,
        "olho-clinico",
        "Olho Clínico",
        "Você desenvolveu o olhar crítico para reconhecer quando a IA erra, alucina ou precisa de checagem humana."
      );
    }
  }

  // Sem Deslizes: nenhuma tentativa errada registrada para NENHUMA questão
  // deste módulo especificamente (RespostaQuestao é append-only — um erro
  // cometido e depois corrigido continua contando pra sempre).
  const errosNesteModulo = await db.respostaQuestao.count({
    where: { usuarioId, moduloId, correta: false },
  });
  if (errosNesteModulo === 0) {
    await concederConquista(
      db,
      usuarioId,
      "sem-deslizes",
      "Sem Deslizes",
      "Você concluiu um módulo acertando todas as questões já na primeira tentativa."
    );
  }

  await processarTrofeusBasica(usuarioId, db);
}

/** Só produz efeito quando a Trilha Básica inteira já está concluída — cada
 * troféu reavalia do zero, seguro de chamar em toda conclusão de módulo. */
async function processarTrofeusBasica(usuarioId: string, db: PrismaOuTransacao): Promise<void> {
  const idsBasica = listarIdsModulos("basica");
  const progresso = await db.progressoModulo.findMany({
    where: { usuarioId, trilha: "basica", moduloId: { in: idsBasica }, concluido: true },
    select: { criadoEm: true, concluidoEm: true },
    orderBy: { criadoEm: "asc" },
  });
  if (progresso.length !== idsBasica.length) return;

  // Toga Impecável: zero erros em toda a trilha.
  const errosTotal = await db.respostaQuestao.count({
    where: { usuarioId, moduloId: { in: idsBasica }, correta: false },
  });
  if (errosTotal === 0) {
    await concederConquista(
      db,
      usuarioId,
      "trilha-basica-toga-impecavel",
      "Toga Impecável",
      "Você atravessou a Trilha Básica inteira sem errar uma questão sequer.",
      "TROFEU"
    );
  }

  // Sentença em Primeira Instância: ≤5 dias corridos do início ao fim, com
  // taxa de acerto ≥90% em toda a trilha.
  const concluidosEm = progresso.map((p) => p.concluidoEm).filter((d): d is Date => d !== null);
  if (concluidosEm.length === idsBasica.length) {
    const inicio = progresso[0].criadoEm;
    const fim = concluidosEm.reduce((max, d) => (d > max ? d : max), concluidosEm[0]);
    const diasCorridos = (fim.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000);

    const [totalRespostas, acertos] = await Promise.all([
      db.respostaQuestao.count({ where: { usuarioId, moduloId: { in: idsBasica } } }),
      db.respostaQuestao.count({ where: { usuarioId, moduloId: { in: idsBasica }, correta: true } }),
    ]);
    const taxaAcerto = totalRespostas > 0 ? acertos / totalRespostas : 0;

    if (diasCorridos <= MAX_DIAS_SENTENCA_PRIMEIRA_INSTANCIA && taxaAcerto >= MIN_TAXA_ACERTO_SENTENCA_PRIMEIRA_INSTANCIA) {
      await concederConquista(
        db,
        usuarioId,
        "trilha-basica-sentenca-primeira-instancia",
        "Sentença em Primeira Instância",
        "Rápido e certeiro: você concluiu a Trilha Básica em poucos dias, e com solidez — sem depender de sorte.",
        "TROFEU"
      );
    }

    // Sem Perder o Prazo: maior intervalo entre conclusões consecutivas ≤72h.
    const ordenadas = [...concluidosEm].sort((a, b) => a.getTime() - b.getTime());
    let maiorIntervaloMs = 0;
    for (let i = 1; i < ordenadas.length; i++) {
      const intervalo = ordenadas[i].getTime() - ordenadas[i - 1].getTime();
      if (intervalo > maiorIntervaloMs) maiorIntervaloMs = intervalo;
    }
    if (maiorIntervaloMs <= MAX_HIATO_MS_SEM_PERDER_O_PRAZO) {
      await concederConquista(
        db,
        usuarioId,
        "trilha-basica-sem-perder-o-prazo",
        "Sem Perder o Prazo",
        "Você manteve o ritmo do início ao fim, sem deixar mais de 3 dias de intervalo entre uma conclusão e outra.",
        "TROFEU"
      );
    }
  }

  // Primeira Turma da OAB: entre os N primeiros certificados de básica do
  // escritório inteiro — conta só OUTROS usuários, então não depende de
  // este já ter (ou não) o próprio certificado emitido ainda.
  const outrosCertificados = await db.certificado.count({
    where: { trilha: "basica", usuarioId: { not: usuarioId } },
  });
  if (outrosCertificados < N_PRIMEIRA_TURMA_OAB) {
    await concederConquista(
      db,
      usuarioId,
      "trilha-basica-primeira-turma-oab",
      "Primeira Turma da OAB",
      "Você está entre os primeiros colegas do escritório a concluir a Trilha Básica.",
      "TROFEU"
    );
  }

  // Segunda Chamada: zerou corações ao menos 1x antes de concluir a trilha.
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: { zerouCoracoesNaBasica: true },
  });
  if (usuario?.zerouCoracoesNaBasica) {
    await concederConquista(
      db,
      usuarioId,
      "trilha-basica-segunda-chamada",
      "Segunda Chamada",
      "Você zerou os corações em algum momento da Trilha Básica — e voltou, terminou e não deixou barato.",
      "TROFEU"
    );
  }
}
