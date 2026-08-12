import { describe, it, expect } from "vitest";
import {
  validarResposta,
  sanitizarQuestaoParaCliente,
  parseQuestaoId,
} from "../content";

describe("validarResposta — multipla_escolha / correcao_prompt", () => {
  const questao = {
    tipo: "multipla_escolha",
    alternativas: [
      { id: "a", texto: "errada", correta: false },
      { id: "b", texto: "certa", correta: true },
    ],
  };

  it("retorna true quando a alternativa marcada é a correta", () => {
    expect(validarResposta(questao, { alternativaId: "b" })).toBe(true);
  });

  it("retorna false quando a alternativa marcada é errada", () => {
    expect(validarResposta(questao, { alternativaId: "a" })).toBe(false);
  });

  it("retorna false (não quebra) quando a alternativa enviada não existe", () => {
    expect(validarResposta(questao, { alternativaId: "z" })).toBe(false);
  });

  it("retorna false (não quebra) quando a resposta enviada está ausente", () => {
    expect(validarResposta(questao, undefined)).toBe(false);
  });
});

describe("validarResposta — verdadeiro_falso", () => {
  const questao = {
    tipo: "verdadeiro_falso",
    justificativas: [
      { id: "a", texto: "certa", correta: true },
      { id: "b", texto: "errada", correta: false },
    ],
  };

  it("valida pela justificativa escolhida, não por um campo booleano solto", () => {
    expect(validarResposta(questao, { justificativaId: "a" })).toBe(true);
    expect(validarResposta(questao, { justificativaId: "b" })).toBe(false);
  });
});

describe("validarResposta — completar_lacuna", () => {
  const questao = {
    tipo: "completar_lacuna",
    lacunas: [
      { posicao: 1, correta: "contexto" },
      { posicao: 2, correta: "formato" },
    ],
  };

  it("exige que todas as lacunas estejam corretas", () => {
    expect(
      validarResposta(questao, {
        respostas: [
          { posicao: 1, valor: "contexto" },
          { posicao: 2, valor: "formato" },
        ],
      })
    ).toBe(true);
  });

  it("retorna false se qualquer lacuna estiver errada", () => {
    expect(
      validarResposta(questao, {
        respostas: [
          { posicao: 1, valor: "contexto" },
          { posicao: 2, valor: "errado" },
        ],
      })
    ).toBe(false);
  });
});

describe("validarResposta — associacao", () => {
  const questao = {
    tipo: "associacao",
    pares: [
      { termo: "IA", definicao: "Campo amplo" },
      { termo: "ML", definicao: "Aprende com dados" },
    ],
  };

  it("exige que todo par esteja corretamente associado", () => {
    expect(
      validarResposta(questao, {
        pares: [
          { termo: "IA", definicaoEscolhida: "Campo amplo" },
          { termo: "ML", definicaoEscolhida: "Aprende com dados" },
        ],
      })
    ).toBe(true);
  });

  it("retorna false se um par estiver trocado", () => {
    expect(
      validarResposta(questao, {
        pares: [
          { termo: "IA", definicaoEscolhida: "Aprende com dados" },
          { termo: "ML", definicaoEscolhida: "Campo amplo" },
        ],
      })
    ).toBe(false);
  });
});

describe("validarResposta — ordenar_etapas", () => {
  const questao = { tipo: "ordenar_etapas", etapas_corretas: ["a", "b", "c"] };

  it("exige a ordem exata", () => {
    expect(validarResposta(questao, { ordem: ["a", "b", "c"] })).toBe(true);
    expect(validarResposta(questao, { ordem: ["b", "a", "c"] })).toBe(false);
  });

  it("retorna false se a quantidade de etapas enviada for diferente", () => {
    expect(validarResposta(questao, { ordem: ["a", "b"] })).toBe(false);
  });
});

describe("validarResposta — resposta_curta_autoavaliada", () => {
  it("não tem gabarito — sempre retorna null", () => {
    const questao = { tipo: "resposta_curta_autoavaliada" };
    expect(validarResposta(questao, { texto: "qualquer coisa" })).toBeNull();
  });
});

describe("sanitizarQuestaoParaCliente — nunca deve vazar o gabarito", () => {
  it("remove o campo 'correta' das alternativas", () => {
    const questao = {
      id: "q1",
      tipo: "multipla_escolha",
      enunciado: "...",
      alternativas: [
        { id: "a", texto: "x", correta: false },
        { id: "b", texto: "y", correta: true },
      ],
    };
    const sanitizada = sanitizarQuestaoParaCliente(questao);
    for (const alt of sanitizada.alternativas) {
      expect(alt).not.toHaveProperty("correta");
    }
  });

  it("não envia etapas_corretas em ordenar_etapas, só uma versão embaralhada", () => {
    const questao = { id: "q1", tipo: "ordenar_etapas", enunciado: "...", etapas_corretas: ["a", "b", "c"] };
    const sanitizada = sanitizarQuestaoParaCliente(questao);
    expect(sanitizada).not.toHaveProperty("etapas_corretas");
    expect(sanitizada.etapas_embaralhadas.sort()).toEqual(["a", "b", "c"]);
  });

  it("não envia o pareamento certo em associacao — só listas separadas", () => {
    const questao = {
      id: "q1",
      tipo: "associacao",
      enunciado: "...",
      pares: [
        { termo: "IA", definicao: "Campo amplo" },
        { termo: "ML", definicao: "Aprende com dados" },
      ],
    };
    const sanitizada = sanitizarQuestaoParaCliente(questao);
    expect(sanitizada).not.toHaveProperty("pares");
    expect(sanitizada.termos).toEqual(["IA", "ML"]);
    expect(sanitizada.definicoes.sort()).toEqual(["Aprende com dados", "Campo amplo"]);
  });

  it("não envia exemplo_de_resposta_forte em resposta_curta_autoavaliada", () => {
    const questao = {
      id: "q1",
      tipo: "resposta_curta_autoavaliada",
      enunciado: "...",
      criterios_autoavaliacao: ["a", "b"],
      exemplo_de_resposta_forte: "isso não pode vazar antes de responder",
    };
    const sanitizada = sanitizarQuestaoParaCliente(questao);
    expect(sanitizada).not.toHaveProperty("exemplo_de_resposta_forte");
    expect(sanitizada.criterios_autoavaliacao).toEqual(["a", "b"]);
  });
});

describe("parseQuestaoId", () => {
  it("extrai trilha e moduloId de um id de questão da trilha básica", () => {
    expect(parseQuestaoId("basica-08-q3")).toEqual({ trilha: "basica", moduloId: "basica-08" });
  });

  it("extrai trilha e moduloId de um id de questão da trilha intermediária", () => {
    expect(parseQuestaoId("intermediaria-13-q5")).toEqual({
      trilha: "intermediaria",
      moduloId: "intermediaria-13",
    });
  });
});
