# Relatório de Revisão Pedagógica — Trilhas de Letramento em IA

**Elaborado por:** revisão de gestão de processos e design instrucional
**Escopo:** Trilha Básica (10 módulos, implementada em JSON) e Trilha Intermediária (30 módulos, estrutura e conteúdo validados em conversa, arquivos ainda não gerados)
**Objetivo:** identificar oportunidades de melhoria no potencial de aprendizado e retenção, preservando o tom de gamificação já validado com o time.

---

## Metodologia

Antes de qualquer recomendação, os 10 módulos da Trilha Básica foram auditados programaticamente (contagem real de tipos de questão, não estimativa). A Trilha Intermediária foi avaliada em nível estrutural, já que seu conteúdo ainda está em formato de especificação, não de arquivo final. As recomendações abaixo são organizadas por tema, cada uma com o ponto observado, o risco pedagógico associado e uma ação concreta — sem alterar o tom, a extensão das lições ou o conceito central de cada módulo, que já estão validados.

---

## O que já está bem resolvido (não mexer)

Vale registrar isso antes das oportunidades de melhoria, porque redesenho tem tanto risco quanto ganho:

- **Repetição espaçada intencional** do conceito de revisão humana (Módulos 2 → 8 → 10 da básica) é uma escolha de design sólida e deve ser o modelo para outros conceitos-chave.
- **Qualidade das alternativas** (balanceamento de tamanho, distratores plausíveis) já corrigida e documentada como padrão no README — está em nível adequado para reter.
- **Progressão letramento → técnico → prático** entre as duas trilhas está bem desenhada em termos de arquitetura geral.
- O **Módulo 30** (capstone com casos fictícios + autoavaliação) é o ponto de maior potencial de retenção real da trilha inteira, porque exige produção ativa, não só reconhecimento.

---

## 1. Variedade de tipos de questão está desbalanceada

**Dado real, extraído dos 10 módulos já implementados:**

| Tipo | Ocorrências | % do total |
|---|---|---|
| Múltipla escolha | 30 | 43% |
| Verdadeiro/Falso | 20 | 29% |
| Completar lacuna | 10 | 14% |
| Associação | 8 | 11% |
| Ordenar etapas | 2 | 3% |

**O problema:** todos os 10 módulos seguem exatamente a mesma sequência estrutural — começam com múltipla escolha, seguem com V/F, e terminam com múltipla escolha de aplicação. `ordenar_etapas` aparece em apenas 2 dos 10 módulos. Isso cria dois riscos: (1) previsibilidade — o cérebro humano se acostuma com padrão e passa a "piloto automático" nas primeiras e últimas questões de cada módulo; (2) a variedade de formato é, ela mesma, uma ferramenta de retenção (alternar o tipo de esforço cognitivo mantém atenção).

**Ação recomendada:** ao gerar os arquivos da Trilha Intermediária, quebrar deliberadamente esse padrão fixo — nenhum módulo deveria ter a mesma sequência de tipos que o anterior. `ordenar_etapas` deveria aparecer com frequência parecida aos demais tipos, não como exceção. Para a Trilha Básica já publicada, sugiro uma segunda passada leve (não recriar do zero) só para variar a **posição** de 2-3 tipos de questão por módulo — ganho de variedade sem custo de reescrever conteúdo.

---

## 2. Falta um tipo de questão que o próprio projeto já havia identificado como diferencial

Lá no início do planejamento, ficou definido que o mix ideal de questões incluiria **"correção de prompt"** (dado um prompt ruim aplicado a uma tarefa jurídica, identificar/corrigir o problema) como algo especialmente relevante e não-genérico para o público jurídico. Esse tipo nunca chegou a ser formalizado como categoria de questão — nem na Trilha Básica (correto, não fazia sentido no nível letramento), nem na Trilha Intermediária, mesmo tendo um bloco inteiro dedicado a prompt engineering (Bloco A) e um módulo inteiro sobre depurar prompts (Módulo 6).

**O problema:** o Módulo 6 ("Refinando e depurando prompts") é literalmente sobre diagnosticar prompts ruins — e ainda assim as questões planejadas são só múltipla escolha/V-F sobre o conceito, não uma correção de prompt de fato. Isso é uma lacuna entre o que o módulo ensina e o que ele avalia.

**Ação recomendada:** introduzir um novo tipo de questão, `correcao_prompt`, no schema (prompt vago/problemático + pedido para identificar o que falta ou reescrever) — usar pelo menos no Módulo 6 e reforçar nos Módulos 1, 5 e 13 (todos ligados a construção de prompt). Tecnicamente simples de adicionar ao schema já documentado no README.

---

## 3. Ausência de mecanismo de revisão espaçada entre módulos

**O problema:** cada módulo avalia só o próprio conteúdo. Não existe, em nenhum ponto das duas trilhas, uma questão que traga de volta um conceito de um módulo anterior dentro do quiz de um módulo posterior — mesmo quando o conteúdo referencia explicitamente o módulo anterior (ex: "a gente volta nisso no Módulo 8"). A referência narrativa existe; a reativação avaliativa, não.

**Por que isso importa:** repetição espaçada é um dos mecanismos mais bem documentados de retenção de longo prazo — e é exatamente o tipo de coisa que o formato Duolingo faz bem (misturar itens antigos entre os novos). Hoje a trilha tem a *intenção* narrativa de callback, mas não a *mecânica* de reforço.

**Ação recomendada:** dois níveis de implementação, do mais simples ao mais robusto:
- **Nível 1 (fácil, recomendo para já):** em 2-3 módulos por trilha, incluir 1 questão (das 7) revisando um conceito de um módulo anterior específico, em vez de só o conteúdo do módulo atual.
- **Nível 2 (fase 2, junto ao backend):** um mecanismo de "revisão" que resurge periodicamente questões erradas ou antigas, misturadas aos módulos novos — prática já comprovada em apps de aprendizado por repetição espaçada. Vale registrar como requisito de backend, não só de conteúdo.

---

## 4. Toda avaliação é reconhecimento passivo, exceto o módulo final

**O problema:** das 70 questões da Trilha Básica e das ~180 planejadas para a Intermediária (exceto o Módulo 30), 100% são de reconhecimento — escolher entre opções dadas. Nenhuma pede produção ativa (escrever, mesmo que uma frase curta) até o capstone final da trilha inteira, na 30ª posição.

**Por que isso importa:** reconhecimento é mais fácil de avaliar automaticamente, mas produção ativa gera uma camada de aprendizado mais profunda (efeito de geração — lembrar de algo que você mesmo formulou é mais forte que reconhecer algo que já estava escrito). Indo direto do reconhecimento puro (Módulos 1-29) para produção plena (Módulo 30) é um salto grande demais.

**Ação recomendada:** não é necessário reformular tudo — sugiro introduzir, a partir do Bloco A da Trilha Intermediária, um tipo leve de produção ativa: **"complete com suas palavras"**, uma pergunta aberta curta (1-2 frases) com autoavaliação por critérios simples (parecido com o checklist do Módulo 30, só que em miniatura), preparando o colaborador gradualmente para a tarefa aberta do módulo final, em vez de apresentá-la sem precedente.

---

## 5. Risco de fadiga nos blocos mais técnicos (D e E) da Trilha Intermediária

**O problema:** os Blocos D (conceitos técnicos) e E (API/automação) são, por natureza, mais abstratos e mais distantes do dia a dia imediato do público (estagiários, assistentes jurídicos, advogados). O conteúdo já foi desenhado com boas analogias (o "garçom" para API, por exemplo) — mas são 12 módulos seguidos (18 a 29) de conteúdo mais denso, sem nenhum marco de celebração ou "respiro" formal entre eles.

**Ação recomendada:**
- Adicionar um pequeno marco de conquista ao final de cada bloco (não um módulo novo — um elemento de gamificação: badge de bloco concluído, tela de "checkpoint" com resumo visual do que foi dominado até ali). Isso já está alinhado ao que você validou lá no início (badges temáticas) — só falta amarrar explicitamente ao conteúdo.
- Considerar intercalar, mentalmente, a ordem de bloco D/E com um módulo de aplicação prática leve a cada 3-4 módulos técnicos, para não deixar uma sequência tão longa de conteúdo conceitual sem uso prático imediato. Isso pode ser resolvido só na hora de sequenciar no app (XP/desbloqueio), sem reescrever conteúdo.

---

## 6. Falta uma transição formal entre as duas trilhas

**O problema:** a Trilha Básica termina no Módulo 10 com ética/governança; a Intermediária começa direto no Módulo 1 com anatomia de prompt avançado. Não existe nenhum momento de transição que reconheça a conquista de terminar a trilha básica e prepare a expectativa correta para o salto de complexidade da intermediária.

**Ação recomendada:** um micro-momento (não precisa ser um módulo completo) entre as trilhas — uma tela de celebração + certificado (já estava no seu plano de gamificação original) + uma breve explicação de que "agora entramos em território mais técnico, mas ainda sem programar". Isso é conteúdo leve de produzir e tem alto retorno em retenção motivacional, especialmente por ser a transição de maior risco de abandono (pessoas desistem mais em transições do que no meio de uma sequência já iniciada).

---

## 7. Densidade de linguagem nos módulos de ética/governança (Básica 9 e 10)

**O problema:** numa auditoria de linguagem, os Módulos 9 e 10 da trilha básica (privacidade/sigilo e ética/governança) são os que mais se aproximam de um tom jurídico-formal, com frases um pouco mais longas que a média dos outros módulos — o que faz sentido dado o tema, mas é justamente onde o risco de soar "documento de compliance" em vez de "conteúdo Duolingo" é maior.

**Ação recomendada:** não é reescrever o conteúdo (a substância está correta e é sensível demais para simplificar excessivamente), mas revisar essas duas lições especificamente em busca de frases que possam ser quebradas em duas mais curtas, e considerar 1 exemplo do tipo "isso já aconteceu com fulano fictício" mais story-driven (o Módulo 10 já tem esse elemento na Tela 2 — o Módulo 9 poderia ganhar algo parecido).

---

## Priorização recomendada

| Prioridade | Item | Esforço | Impacto em retenção |
|---|---|---|---|
| Alta | #2 — Adicionar tipo `correcao_prompt` | Baixo (schema já existe, só estender) | Alto — fecha lacuna entre ensino e avaliação |
| Alta | #1 — Variar sequência de tipos de questão | Baixo/médio | Médio-alto |
| Média | #4 — Introduzir produção ativa leve gradual | Médio | Alto (mas é mudança de formato, exige mais cuidado) |
| Média | #6 — Transição entre trilhas | Baixo | Médio (mas resolve o ponto de maior risco de abandono) |
| Média | #3 — Revisão espaçada (nível 1) | Baixo | Alto no longo prazo |
| Baixa/backend | #3 — Revisão espaçada (nível 2) | Alto, depende do backend | Alto, mas é decisão de Fase 2 |
| Baixa | #5 — Checkpoints de bloco (Intermediária) | Baixo (mecânica, não conteúdo) | Médio |
| Baixa | #7 — Densidade de linguagem (Básica 9-10) | Baixo | Baixo-médio |

---

## Observação final

Nenhuma dessas recomendações exige descartar o que já foi construído. A Trilha Básica está publicável como está — as melhorias de #1 e #7 são ajustes finos, não retrabalho. Para a Trilha Intermediária, como os arquivos ainda não foram gerados, o momento ideal para incorporar #1, #2, #4 e #6 é agora, antes da geração dos JSONs — evita reabrir 30 arquivos depois.
