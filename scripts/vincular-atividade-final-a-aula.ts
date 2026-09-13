// Migração única de conteúdo: declara, em cada questão de `atividade_final`,
// qual aula do módulo ensina a resposta dela (`aula_relacionada`, índice
// começando em 1).
//
// Por que precisa existir: quando o usuário erra uma questão, o app oferece
// "Revisar aula". Para as questões embutidas numa aula, o alvo é óbvio (a
// própria aula que contém a questão). Para as 120 questões de atividade
// final não havia vínculo nenhum declarado, e o app caía sempre na ÚLTIMA
// aula do módulo — que na auditoria (scripts/auditar-vinculo-aula-questao.ts)
// se mostrou a aula errada em 81 dos 120 casos.
//
// Os valores abaixo NÃO saíram da heurística da auditoria. A heurística mede
// sobreposição de vocabulário e serviu só como pista; cada questão foi lida
// contra as quatro aulas do seu módulo e o vínculo foi decidido pelo critério
// "se o usuário reler ESTA aula, ela responde a pergunta?".
//
// As três questões com `revisao_de` (basica-05-q8, basica-08-q8,
// basica-10-q8) ficam de fora de propósito: elas revisam um MÓDULO anterior,
// não uma aula do módulo atual, e o app trata esse caso por outro caminho.
//
// Uso: npx tsx scripts/vincular-atividade-final-a-aula.ts [--conferir]
import fs from "fs";
import path from "path";

// modulo_id -> { sufixo da questão: número da aula (base 1) }
const VINCULOS: Record<string, Record<string, number>> = {
  "basica-01": { q5: 3, q6: 2, q7: 4 },
  "basica-02": { q5: 3, q6: 3, q7: 4 },
  "basica-03": { q5: 3, q6: 2, q7: 4 },
  "basica-04": { q5: 3, q6: 4, q7: 4 },
  "basica-05": { q5: 3, q6: 2, q7: 3 },
  "basica-06": { q5: 4, q6: 2, q7: 3 },
  "basica-07": { q5: 1, q6: 4, q7: 3 },
  "basica-08": { q5: 4, q6: 2, q7: 4 },
  "basica-09": { q5: 3, q6: 3, q7: 4 },
  "basica-10": { q5: 4, q6: 3, q7: 4 },
  "intermediaria-01": { q5: 4, q6: 2, q7: 2 },
  "intermediaria-02": { q5: 4, q6: 3, q7: 3 },
  "intermediaria-03": { q5: 2, q6: 4, q7: 3 },
  "intermediaria-04": { q5: 4, q6: 2, q7: 1 },
  "intermediaria-05": { q5: 1, q6: 4, q7: 4 },
  "intermediaria-06": { q5: 4, q6: 2, q7: 3 },
  "intermediaria-07": { q5: 2, q6: 4, q7: 4 },
  "intermediaria-08": { q5: 4, q6: 2, q7: 4 },
  "intermediaria-09": { q5: 2, q6: 4, q7: 3 },
  "intermediaria-10": { q5: 1, q6: 4, q7: 3 },
  "intermediaria-11": { q5: 2, q6: 4, q7: 4 },
  "intermediaria-12": { q5: 2, q6: 4, q7: 2 },
  "intermediaria-13": { q5: 3, q6: 4, q7: 2 },
  "intermediaria-14": { q5: 2, q6: 3, q7: 4 },
  "intermediaria-15": { q5: 4, q6: 2, q7: 2 },
  "intermediaria-16": { q5: 2, q6: 4, q7: 2 },
  "intermediaria-17": { q5: 2, q6: 3, q7: 3 },
  "intermediaria-18": { q5: 2, q6: 4, q7: 4 },
  "intermediaria-19": { q5: 2, q6: 1, q7: 3 },
  "intermediaria-20": { q5: 1, q6: 3, q7: 4 },
  "intermediaria-21": { q5: 3, q6: 4, q7: 3 },
  "intermediaria-22": { q5: 3, q6: 4, q7: 3 },
  "intermediaria-23": { q5: 2, q6: 4, q7: 4 },
  "intermediaria-24": { q5: 1, q6: 4, q7: 4 },
  "intermediaria-25": { q5: 3, q6: 3, q7: 4 },
  "intermediaria-26": { q5: 3, q6: 3, q7: 1 },
  "intermediaria-27": { q5: 1, q6: 4, q7: 1 },
  "intermediaria-28": { q5: 2, q6: 4, q7: 4 },
  "intermediaria-29": { q5: 4, q6: 3, q7: 4 },
};

const PASTAS = ["content/trilha-basica/modulos", "content/trilha-intermediaria/modulos"];
const apenasConferir = process.argv.includes("--conferir");

let vinculadas = 0;
let pulaRevisao = 0;
const problemas: string[] = [];

for (const pasta of PASTAS) {
  for (const arquivo of fs.readdirSync(pasta).filter((f) => f.endsWith(".json")).sort()) {
    const caminho = path.join(pasta, arquivo);
    const modulo = JSON.parse(fs.readFileSync(caminho, "utf-8"));
    const finais = modulo.atividade_final ?? [];
    if (finais.length === 0) continue;

    const mapa = VINCULOS[modulo.modulo_id];
    if (!mapa) {
      problemas.push(`${modulo.modulo_id}: sem vinculos definidos neste script`);
      continue;
    }

    let mudou = false;

    for (const questao of finais) {
      // Questão de revisão de módulo anterior: o alvo de revisão dela é outro
      // módulo, não uma aula deste. Fica sem `aula_relacionada` de propósito.
      if (questao.revisao_de) {
        pulaRevisao++;
        continue;
      }

      const sufixo = String(questao.id).split("-").pop()!;
      const aula = mapa[sufixo];

      if (!aula) {
        problemas.push(`${questao.id}: nenhum vinculo definido`);
        continue;
      }
      if (aula < 1 || aula > (modulo.aulas?.length ?? 0)) {
        problemas.push(`${questao.id}: aula ${aula} fora do intervalo do modulo`);
        continue;
      }

      if (questao.aula_relacionada !== aula) {
        questao.aula_relacionada = aula;
        mudou = true;
      }
      vinculadas++;
    }

    if (mudou && !apenasConferir) {
      fs.writeFileSync(caminho, JSON.stringify(modulo, null, 2) + "\n", "utf-8");
    }
  }
}

console.log(`${vinculadas} questoes de atividade final vinculadas a uma aula.`);
console.log(`${pulaRevisao} puladas por serem revisao de modulo anterior (revisao_de).`);
if (problemas.length > 0) {
  console.log(`\nPROBLEMAS (${problemas.length}):`);
  problemas.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log(apenasConferir ? "\n(--conferir: nenhum arquivo foi escrito)" : "\nArquivos atualizados.");
