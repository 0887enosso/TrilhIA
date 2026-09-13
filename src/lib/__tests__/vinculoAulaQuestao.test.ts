import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Trava de conteúdo: toda questão precisa ter uma aula identificável para
 * onde mandar o usuário quando ele erra.
 *
 * O app oferece "Revisar aula" a cada erro. Antes desta trava, as 120
 * questões de `atividade_final` não declaravam vínculo nenhum e o app caía
 * sempre na última aula do módulo — errada em 81 dos 120 casos, medido por
 * scripts/auditar-vinculo-aula-questao.ts. Conteúdo novo escrito sem o
 * vínculo reintroduziria exatamente esse defeito de forma silenciosa, e é
 * isso que estes testes impedem.
 */

const PASTAS = [
  "content/trilha-basica/modulos",
  "content/trilha-intermediaria/modulos",
];

type Modulo = {
  modulo_id: string;
  tipo_modulo?: string;
  aulas?: { titulo_aula: string; atividade?: { id: string } }[];
  atividade_final?: { id: string; aula_relacionada?: number; revisao_de?: string }[];
};

function carregarModulos(): Modulo[] {
  return PASTAS.flatMap((pasta) =>
    fs
      .readdirSync(pasta)
      .filter((arquivo) => arquivo.endsWith(".json"))
      .map((arquivo) => JSON.parse(fs.readFileSync(path.join(pasta, arquivo), "utf-8")) as Modulo)
  );
}

const modulos = carregarModulos();
const comAulas = modulos.filter((m) => (m.aulas?.length ?? 0) > 0);

describe("vínculo entre questão e aula", () => {
  it("carrega todos os módulos de conteúdo", () => {
    // Guarda contra o teste passar vazio se os caminhos mudarem de lugar.
    expect(modulos.length).toBeGreaterThanOrEqual(40);
    expect(comAulas.length).toBeGreaterThanOrEqual(39);
  });

  it("toda questão de atividade final aponta para uma aula do próprio módulo, ou é revisão de outro módulo", () => {
    const semVinculo: string[] = [];

    for (const modulo of comAulas) {
      const totalAulas = modulo.aulas!.length;

      for (const questao of modulo.atividade_final ?? []) {
        // Revisão de módulo anterior: o alvo é outro módulo, não uma aula
        // deste — tratado por outro caminho no app.
        if (questao.revisao_de) continue;

        const aula = questao.aula_relacionada;
        if (typeof aula !== "number" || aula < 1 || aula > totalAulas) {
          semVinculo.push(`${questao.id} (aula_relacionada=${aula}, módulo tem ${totalAulas} aulas)`);
        }
      }
    }

    expect(semVinculo).toEqual([]);
  });

  it("`revisao_de` sempre aponta para um módulo que existe", () => {
    const ids = new Set(modulos.map((m) => m.modulo_id));
    const quebrados: string[] = [];

    for (const modulo of modulos) {
      for (const questao of modulo.atividade_final ?? []) {
        if (questao.revisao_de && !ids.has(questao.revisao_de)) {
          quebrados.push(`${questao.id} -> ${questao.revisao_de}`);
        }
      }
    }

    expect(quebrados).toEqual([]);
  });

  it("toda aula tem a sua própria atividade — é o que garante o vínculo implícito delas", () => {
    const semAtividade: string[] = [];

    for (const modulo of comAulas) {
      modulo.aulas!.forEach((aula, i) => {
        if (!aula.atividade?.id) semAtividade.push(`${modulo.modulo_id} aula ${i + 1}`);
      });
    }

    expect(semAtividade).toEqual([]);
  });

  it("ids de questão são únicos em todo o conteúdo", () => {
    // Ids duplicados quebrariam o progresso: XpConcedido e RespostaQuestao
    // referenciam a questão só pelo id.
    const vistos = new Map<string, string>();
    const duplicados: string[] = [];

    for (const modulo of modulos) {
      const todas = [
        ...(modulo.aulas ?? []).map((a) => a.atividade?.id),
        ...(modulo.atividade_final ?? []).map((q) => q.id),
      ].filter(Boolean) as string[];

      for (const id of todas) {
        if (vistos.has(id)) duplicados.push(`${id} (em ${vistos.get(id)} e ${modulo.modulo_id})`);
        else vistos.set(id, modulo.modulo_id);
      }
    }

    expect(duplicados).toEqual([]);
  });
});
