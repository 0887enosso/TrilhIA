// Auditoria de vínculo entre aula e questão.
//
// Problema que motivou: a mecânica do app manda o usuário "revisar a aula"
// quando ele erra — mas nada garante que a aula apontada seja onde aquilo
// foi ensinado. Para as questões de `atividade_final` não existe nem
// vínculo declarado: o app cai na última aula do módulo, sempre.
//
// Esta auditoria mede, para cada questão, quanto do vocabulário que ela
// EXIGE aparece no texto da aula à qual ela está (ou estaria) ligada. Não é
// avaliação semântica — é um detector de discrepância grosseira, do tipo
// "a questão fala de copilot e a aula dela nunca escreve copilot". Serve
// para ordenar o trabalho de revisão por gravidade, não para substituir a
// leitura humana.
//
// Uso: npx tsx scripts/auditar-vinculo-aula-questao.ts [--detalhe]
import fs from "fs";
import path from "path";

const TRILHAS = [
  { nome: "basica", pasta: "content/trilha-basica/modulos" },
  { nome: "intermediaria", pasta: "content/trilha-intermediaria/modulos" },
];

// Limiar abaixo do qual a questão é considerada desancorada da sua aula.
const LIMIAR_ALERTA = 0.5;

// Só palavras funcionais e andaime de enunciado ("ligue cada opção à
// alternativa correta"). Palavras de domínio ficam FORA desta lista, por mais
// genéricas que pareçam: numa primeira versão daqui, "exemplo" e "exemplos"
// estavam listados como vazios — e isso zerou a medição do módulo de
// few-shot, que é justamente o módulo sobre fornecer EXEMPLOS. O mesmo valia
// para "caso", "tipo", "forma" e "texto", que são termos centrais em vários
// módulos. Filtrar termo de domínio faz a auditoria acusar desancoragem onde
// não existe.
const VAZIAS = new Set(
  ("a as ao aos com como da das de dela dele deles do dos e ela elas ele eles em entre era essa esse esta este eu " +
    "foi for isso isto ja la lhe mais mas me mesmo mesma meu minha muito na nao nas nem no nos numa nunca o os ou para " +
    "pela pelo per por quando que quem se sem ser seu sua sao so tambem te tem tinha tu tua um uma voce vos " +
    "qualquer sobre sempre cada onde entao depois antes ainda apenas pode deve sendo suas seus todo " +
    "toda todos todas outro outra outros outras algum alguma dentro fora alem porque assim pois aquele aquela " +
    "opcoes opcao alternativa alternativas seguir abaixo acima correta correto certa certo qual quais")
    .split(/\s+/)
);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

/** Palavras de conteúdo: com 5+ letras, fora da lista de vazias. Radical
 *  cortado em 6 letras para casar plural/flexão ("ferramenta"/"ferramentas",
 *  "integrado"/"integrada") sem precisar de stemmer de verdade. */
function termos(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(/\s+/)
      .filter((p) => p.length >= 5 && !VAZIAS.has(p))
      .map((p) => p.slice(0, 6))
  );
}

function textoDaAula(aula: any): string {
  return [aula.titulo_aula, aula.corpo, aula.destaque].filter(Boolean).join(" ");
}

/** O que a questão exige saber: enunciado + a resposta correta (e só ela —
 *  os distratores descrevem o que NÃO foi ensinado, então entrariam como
 *  ruído). */
function textoExigidoPelaQuestao(q: any): string {
  const partes: string[] = [q.enunciado ?? ""];

  if (Array.isArray(q.alternativas)) {
    partes.push(...q.alternativas.filter((a: any) => a.correta).map((a: any) => a.texto));
  }
  if (Array.isArray(q.justificativas)) {
    partes.push(...q.justificativas.filter((j: any) => j.correta).map((j: any) => j.texto));
  }
  if (Array.isArray(q.pares)) {
    partes.push(...q.pares.flatMap((p: any) => [p.termo, p.definicao]));
  }
  if (Array.isArray(q.lacunas)) {
    partes.push(...q.lacunas.map((l: any) => l.correta));
  }
  if (Array.isArray(q.etapas_corretas)) partes.push(...q.etapas_corretas);
  if (Array.isArray(q.criterios_autoavaliacao)) partes.push(...q.criterios_autoavaliacao);

  return partes.filter(Boolean).join(" ");
}

function cobertura(qTexto: string, aulaTexto: string): number {
  const exigidos = termos(qTexto);
  if (exigidos.size === 0) return 1;
  const disponiveis = termos(aulaTexto);
  let encontrados = 0;
  for (const t of exigidos) if (disponiveis.has(t)) encontrados++;
  return encontrados / exigidos.size;
}

const detalhe = process.argv.includes("--detalhe");

let totalAula = 0;
let alertasAula = 0;
let melhorEmOutraAula = 0;
let totalFinal = 0;
const linhasAlerta: string[] = [];
const propostasVinculo: string[] = [];

for (const trilha of TRILHAS) {
  const arquivos = fs.readdirSync(trilha.pasta).filter((f) => f.endsWith(".json")).sort();

  for (const arquivo of arquivos) {
    const modulo = JSON.parse(fs.readFileSync(path.join(trilha.pasta, arquivo), "utf-8"));
    const aulas = modulo.aulas ?? [];
    if (aulas.length === 0) continue;

    // Anotado porque `modulo` vem de JSON.parse (ou seja, `any`): sem isto o
    // tipo se perde aqui e os `.map()` mais abaixo recebem parâmetro
    // implicitamente `any`, o que o `next build` rejeita ao checar tipos.
    const textosAulas: string[] = aulas.map(textoDaAula);

    // --- Questões embutidas em cada aula ---
    aulas.forEach((aula: any, i: number) => {
      if (!aula.atividade) return;
      totalAula++;

      const exigido = textoExigidoPelaQuestao(aula.atividade);
      const propria = cobertura(exigido, textosAulas[i]);
      const porAula = textosAulas.map((t) => cobertura(exigido, t));
      const melhor = porAula.indexOf(Math.max(...porAula));

      if (melhor !== i && porAula[melhor] - propria > 0.15) melhorEmOutraAula++;

      if (propria < LIMIAR_ALERTA) {
        alertasAula++;
        linhasAlerta.push(
          `${modulo.modulo_id} aula ${i + 1} (${aula.atividade.id}): cobertura ${(propria * 100).toFixed(0)}%` +
            (melhor !== i ? `  -> casa melhor com a aula ${melhor + 1} (${(porAula[melhor] * 100).toFixed(0)}%)` : "") +
            (detalhe ? `\n     "${aula.atividade.enunciado.replace(/\s+/g, " ").slice(0, 130)}"` : "")
        );
      }
    });

    // --- Questões da atividade final: não têm aula declarada ---
    (modulo.atividade_final ?? []).forEach((q: any) => {
      totalFinal++;
      const exigido = textoExigidoPelaQuestao(q);
      const porAula = textosAulas.map((t) => cobertura(exigido, t));
      const melhor = porAula.indexOf(Math.max(...porAula));
      propostasVinculo.push(
        `${modulo.modulo_id} ${String(q.id).padEnd(20)} melhor aula: ${melhor + 1} (${(porAula[melhor] * 100).toFixed(0)}%)` +
          `   hoje o app manda para a aula ${aulas.length}`
      );
    });
  }
}

console.log("=".repeat(80));
console.log("QUESTOES EMBUTIDAS EM AULA (vinculo existe — a questao esta DENTRO da aula)");
console.log("=".repeat(80));
console.log(`Total: ${totalAula}`);
console.log(`Abaixo de ${LIMIAR_ALERTA * 100}% de cobertura da propria aula: ${alertasAula} (${((alertasAula / totalAula) * 100).toFixed(0)}%)`);
console.log(`Casam melhor com OUTRA aula do mesmo modulo: ${melhorEmOutraAula} (${((melhorEmOutraAula / totalAula) * 100).toFixed(0)}%)`);
console.log("");
linhasAlerta.slice(0, detalhe ? 999 : 25).forEach((l) => console.log("  " + l));
if (!detalhe && linhasAlerta.length > 25) console.log(`  ... e mais ${linhasAlerta.length - 25} (rode com --detalhe)`);

console.log("");
console.log("=".repeat(80));
console.log("QUESTOES DE ATIVIDADE FINAL (nenhum vinculo declarado hoje)");
console.log("=".repeat(80));
console.log(`Total: ${totalFinal} — o app manda todas para a ULTIMA aula do modulo ao errar.`);
console.log("Aula que melhor casa com cada uma (proposta de vinculo):\n");
propostasVinculo.slice(0, detalhe ? 999 : 20).forEach((l) => console.log("  " + l));
if (!detalhe && propostasVinculo.length > 20) console.log(`  ... e mais ${propostasVinculo.length - 20} (rode com --detalhe)`);

const desalinhadas = propostasVinculo.filter((l) => {
  const m = l.match(/melhor aula: (\d+).*aula (\d+)$/);
  return m && m[1] !== m[2];
}).length;
console.log(`\nDessas, ${desalinhadas} de ${totalFinal} apontam para uma aula DIFERENTE da que o app usa hoje.`);

// --- Distribuição por gravidade e ranking de módulos -----------------------
// A cobertura por si não prova erro pedagógico: uma questão de aplicação
// pode ser respondível pela aula usando outras palavras. O que a faixa
// separa é a CHANCE de ser erro real — abaixo de 20% praticamente não há
// como a aula ter ensinado aquilo; entre 40 e 50% quase sempre é só
// vocabulário diferente e precisa de leitura humana.
const faixas = { ate20: 0, de20a40: 0, de40a50: 0, acima50: 0 };
const porModuloScore = new Map<string, { soma: number; n: number; criticas: number }>();

for (const trilha of TRILHAS) {
  const arquivos = fs.readdirSync(trilha.pasta).filter((f) => f.endsWith(".json")).sort();
  for (const arquivo of arquivos) {
    const modulo = JSON.parse(fs.readFileSync(path.join(trilha.pasta, arquivo), "utf-8"));
    const aulas = modulo.aulas ?? [];
    if (aulas.length === 0) continue;
    const textosAulas = aulas.map(textoDaAula);

    aulas.forEach((aula: any, i: number) => {
      if (!aula.atividade) return;
      const c = cobertura(textoExigidoPelaQuestao(aula.atividade), textosAulas[i]);
      if (c < 0.2) faixas.ate20++;
      else if (c < 0.4) faixas.de20a40++;
      else if (c < 0.5) faixas.de40a50++;
      else faixas.acima50++;

      const atual = porModuloScore.get(modulo.modulo_id) ?? { soma: 0, n: 0, criticas: 0 };
      atual.soma += c;
      atual.n += 1;
      if (c < 0.2) atual.criticas += 1;
      porModuloScore.set(modulo.modulo_id, atual);
    });
  }
}

console.log("\n" + "=".repeat(80));
console.log("DISTRIBUICAO POR GRAVIDADE (só as 156 questoes embutidas em aula)");
console.log("=".repeat(80));
console.log(`  ate 20% de cobertura .... ${String(faixas.ate20).padStart(3)}  quase certamente a aula nao ensina aquilo`);
console.log(`  20% a 40% ............... ${String(faixas.de20a40).padStart(3)}  vinculo fraco, revisar`);
console.log(`  40% a 50% ............... ${String(faixas.de40a50).padStart(3)}  provavelmente so vocabulario diferente`);
console.log(`  acima de 50% ............ ${String(faixas.acima50).padStart(3)}  ancorada`);

const ranking = [...porModuloScore.entries()]
  .map(([id, v]) => ({ id, media: v.soma / v.n, criticas: v.criticas }))
  .sort((a, b) => a.media - b.media);

console.log("\nModulos com pior ancoragem media (candidatos a reescrita de aula):");
ranking.slice(0, 12).forEach((m) =>
  console.log(`  ${m.id.padEnd(18)} media ${(m.media * 100).toFixed(0).padStart(3)}%   questoes criticas: ${m.criticas}/4`)
);
console.log("\nModulos melhor ancorados (provavelmente so ajuste fino):");
ranking.slice(-6).reverse().forEach((m) =>
  console.log(`  ${m.id.padEnd(18)} media ${(m.media * 100).toFixed(0).padStart(3)}%   questoes criticas: ${m.criticas}/4`)
);
