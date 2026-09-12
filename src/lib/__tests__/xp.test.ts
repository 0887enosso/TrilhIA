import { describe, it, expect } from "vitest";
import { xpPorTipoQuestao, calcularNivel, progressoDoNivel } from "../xp";

describe("xpPorTipoQuestao", () => {
  it("retorna o valor certo para cada tipo conhecido", () => {
    expect(xpPorTipoQuestao("verdadeiro_falso")).toBe(10);
    expect(xpPorTipoQuestao("completar_lacuna")).toBe(10);
    expect(xpPorTipoQuestao("multipla_escolha")).toBe(15);
    expect(xpPorTipoQuestao("associacao")).toBe(15);
    expect(xpPorTipoQuestao("ordenar_etapas")).toBe(15);
    expect(xpPorTipoQuestao("correcao_prompt")).toBe(20);
    expect(xpPorTipoQuestao("resposta_curta_autoavaliada")).toBe(25);
  });

  it("falha alto para um tipo desconhecido, em vez de pagar um valor errado silenciosamente", () => {
    expect(() => xpPorTipoQuestao("tipo_que_nao_existe")).toThrow();
  });
});

describe("calcularNivel", () => {
  it("começa no nível 1 com XP zero", () => {
    expect(calcularNivel(0)).toBe(1);
  });

  it("sobe de nível a cada 300 XP", () => {
    expect(calcularNivel(299)).toBe(1);
    expect(calcularNivel(300)).toBe(2);
    expect(calcularNivel(599)).toBe(2);
    expect(calcularNivel(600)).toBe(3);
  });
});

describe("progressoDoNivel", () => {
  it("zera ao entrar num nível novo e completa ao encostar no próximo", () => {
    expect(progressoDoNivel(0)).toEqual({ xpNoNivel: 0, xpParaProximo: 300, percentual: 0 });
    expect(progressoDoNivel(300)).toEqual({ xpNoNivel: 0, xpParaProximo: 300, percentual: 0 });
    expect(progressoDoNivel(299)).toEqual({ xpNoNivel: 299, xpParaProximo: 1, percentual: 100 });
  });

  it("conta a partir do XP dentro do nível atual, não do total acumulado", () => {
    // 450 XP = nível 2 com 150 já andados dentro dele.
    expect(calcularNivel(450)).toBe(2);
    expect(progressoDoNivel(450)).toEqual({ xpNoNivel: 150, xpParaProximo: 150, percentual: 50 });
  });
});
