import { describe, it, expect } from "vitest";
import { semanaIsoDe } from "../ligas";

describe("semanaIsoDe", () => {
  it("calcula a semana ISO corretamente para uma data conhecida", () => {
    // 2026-01-01 é uma quinta-feira -> pertence à semana ISO 1 de 2026.
    expect(semanaIsoDe(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-W01");
  });

  it("datas na mesma semana ISO retornam o mesmo identificador", () => {
    const segunda = semanaIsoDe(new Date(Date.UTC(2026, 7, 10))); // 10 ago 2026, segunda
    const domingo = semanaIsoDe(new Date(Date.UTC(2026, 7, 16))); // 16 ago 2026, domingo
    expect(segunda).toBe(domingo);
  });

  it("a semana seguinte tem um identificador diferente", () => {
    const semanaA = semanaIsoDe(new Date(Date.UTC(2026, 7, 10)));
    const semanaB = semanaIsoDe(new Date(Date.UTC(2026, 7, 17)));
    expect(semanaA).not.toBe(semanaB);
  });
});
