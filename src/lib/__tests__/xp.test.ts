import { describe, it, expect } from "vitest";
import { xpPorTipoQuestao, calcularNivel } from "../xp";

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
