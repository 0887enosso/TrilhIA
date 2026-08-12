# Trilha Básica — Letramento em IA

Documentação de conteúdo programático da **Trilha Básica** do aplicativo de ensino de IA para colaboradores (estagiários, assistentes jurídicos e advogados). Este documento serve como contexto de referência tanto para revisão editorial quanto para as fases de backend e frontend do projeto (incluindo uso com Claude Code).

## Visão geral

- **Público-alvo:** colaboradores de escritório de advocacia com pouca ou nenhuma vivência prática com IA.
- **Objetivo da trilha:** letramento generalista em IA — do "o que é IA" até governança e uso responsável. Não ensina a construir ferramentas, ensina a entender e usar bem qualquer ferramenta com IA, inclusive as que o escritório já oferece.
- **Formato:** 10 módulos, sequenciais, cada um com 4 telas de conteúdo (micro-learning) + 7 questões de fixação.
- **Pré-requisito para a Trilha Intermediária:** conclusão desta trilha.

## Estrutura da trilha

| # | Módulo | Foco |
|---|--------|------|
| 1 | O que é Inteligência Artificial | Conceitos fundamentais, desmistificação do termo |
| 2 | Como a IA generativa "pensa" | Previsão de padrão vs. raciocínio — planta a semente da alucinação |
| 3 | O panorama das ferramentas de IA | Categorias de ferramentas existentes no mercado |
| 4 | Como funciona uma plataforma com IA integrada | Padrão entrada→modelo→saída, generalizável a qualquer ferramenta |
| 5 | Primeiros passos: como se comunicar bem com uma IA | Mecânica de interação, contexto, iteração |
| 6 | O que é um prompt e por que ele muda o resultado | Introdução a prompt (nível letramento, não técnico) |
| 7 | Para que serve a IA no dia a dia de um escritório | Categorias de tarefas — onde ajuda bem, onde exige cuidado |
| 8 | Por que a resposta da IA não é uma verdade pronta | **Módulo-núcleo**: alucinação, com exemplos jurídicos concretos |
| 9 | Privacidade, sigilo e segurança da informação | Sigilo profissional, LGPD aplicada ao uso de IA |
| 10 | Ética, governança e uso responsável | Revisão humana como dever profissional, políticas internas |

**Reforço pedagógico intencional:** o conceito de "resposta de IA não é verdade pronta / exige revisão humana" é plantado no Módulo 2, aprofundado como núcleo no Módulo 8, e fechado como regra de conduta profissional no Módulo 10 — repetição espaçada em três camadas (conceitual → prático → ético-profissional).

## Guia de voz e tom (aplicado nesta revisão)

Para evitar que o conteúdo soe como material didático tradicional ("cuspir conteúdo"), toda a trilha foi revisada seguindo estes princípios — que devem se manter também na Trilha Intermediária:

1. **Endereçamento direto:** sempre "você", nunca "o usuário" ou terceira pessoa distante.
2. **Frases curtas, ritmo variado.** Evitar parágrafos longos e uniformes.
3. **Gancho antes da explicação.** Cada tela abre com uma ideia provocativa ou relatable, não com definição seca.
4. **Analogias do cotidiano** (bonecas russas, corretor preditivo do celular) para conceitos abstratos.
5. **Conexão entre módulos explícita** ("a gente volta nisso no Módulo 8") — cria senso de progressão narrativa, não de módulos isolados.
6. **Nada de jargão sem explicação imediata.** Todo termo técnico introduzido é definido na mesma frase ou logo em seguida.
7. **Questões com propósito pedagógico real:** todas têm `explicacao` associada (acerto e/ou erro), reforçando o aprendizado no momento do feedback — nunca são apenas "certo/errado" sem contexto.

## Critérios de qualidade das questões (revisão aplicada)

Todas as 70 questões passaram por uma segunda revisão para eliminar dois vieses comuns em banco de questões malfeito:

1. **Viés de tamanho:** em uma primeira versão, a alternativa correta costumava ser a mais longa/detalhada — o que permite acertar por padrão de formato, sem saber o conteúdo. Todas as alternativas foram reescritas com extensão e nível de detalhe equivalentes.
2. **Distratores óbvios demais:** alternativas erradas absurdas ou irrelevantes (que qualquer pessoa eliminaria por bom senso, mesmo sem saber o conteúdo) foram substituídas por **erros plausíveis** — concepções equivocadas reais que alguém sem o letramento adequado poderia ter. O objetivo é que errar a questão exija de fato não ter entendido o conceito, não apenas não ter lido as opções com atenção.

Esse padrão de qualidade deve ser mantido ao criar as questões da Trilha Intermediária.

## Revisão pedagógica aplicada (segunda passada)

Após uma auditoria formal (ver `/mnt/user-data/outputs/revisao-pedagogica-trilhas.md`), os seguintes ajustes foram aplicados diretamente nos arquivos já publicados:

1. **Maior variedade de tipos de questão.** `ordenar_etapas` era usado em apenas 2 dos 10 módulos — passou a aparecer em 5, substituindo questões que se prestavam naturalmente a uma sequência lógica (Módulos 6, 7 e 9).
2. **Revisão espaçada (nível 1).** Os Módulos 5, 8 e 10 ganharam uma 8ª questão opcional, marcada com o campo `"revisao_de": "{modulo_id}"`, reativando um conceito de um módulo anterior específico. Esse campo deve ser lido pelo backend como sinal de que a questão reforça conteúdo antigo — útil para métricas de retenção e para lógica futura de repetição espaçada (nível 2, ver relatório).
3. **Densidade de linguagem.** O Módulo 9 (privacidade e sigilo) teve duas telas reescritas com frases mais curtas e um exemplo concreto ("já foi motivo de investigação disciplinar..."), no mesmo espírito que o Módulo 10 já tinha.

## Transição para a Trilha Intermediária

O arquivo `/mnt/user-data/outputs/transicao-trilha-basica-para-intermediaria.json` contém o conteúdo da tela de celebração exibida ao concluir o 10º módulo (badge, certificado, texto de ponte para a próxima trilha) — implementado para reduzir o risco de abandono na transição entre trilhas, identificado na revisão pedagógica.

## Estrutura dos arquivos

```
trilha-basica/
├── README.md                 (este arquivo)
└── modulos/
    ├── modulo-01.json
    ├── modulo-02.json
    ├── ...
    └── modulo-10.json
```

## Schema de cada módulo (`modulo-XX.json`)

**Atualizado na Fase 2** — o formato antigo (`conteudo` + `questoes` separados) foi migrado para `aulas` (cada uma já com sua própria atividade embutida) + `atividade_final` (uma atividade maior, integrando o módulo inteiro). Motivo: o app segue a mecânica do Duolingo — ensino curto seguido de fixação imediata, não uma leitura longa com quiz só no final. Migração feita por `scripts/migrar_schema_conteudo.py`, preservando 100% das questões já revisadas na Fase 1.

```jsonc
{
  "modulo_id": "basica-01",           // identificador único, usado como referência no backend
  "trilha": "basica",
  "ordem": 1,                          // posição na sequência da trilha
  "titulo": "string",
  "descricao_curta": "string",         // usada como preview/card na interface
  "tempo_estimado_min": 4,
  "objetivos_aprendizagem": ["string"],
  "aulas": [
    {
      "ordem": 1,
      "titulo_aula": "string",
      "corpo": "string",
      "destaque": "string opcional",   // frase de efeito, analogia ou reforço visual
      "atividade": { /* uma questão — ver tipos abaixo — mostrada logo após esta aula */ }
    }
  ],
  "atividade_final": [ /* questões — ver tipos abaixo — atividade maior ao final do módulo, integrando o tema */ ]
}
```

### Tipos de questão suportados

| `tipo` | Campos específicos |
|---|---|
| `multipla_escolha` | `alternativas: [{id, texto, correta}]`, `explicacao_acerto`, `explicacao_erro` |
| `verdadeiro_falso` | `resposta_correta: bool`, `justificativas: [{id, texto, correta}]` (a pessoa escolhe a justificativa certa, não só V/F), `explicacao` |
| `associacao` | `pares: [{termo, definicao}]` — a interface deve embaralhar e pedir para ligar |
| `completar_lacuna` | `lacunas: [{posicao, opcoes, correta}]` — suporta múltiplas lacunas por questão |
| `ordenar_etapas` | `etapas_corretas: [string]` — a interface deve embaralhar a ordem de exibição |

Todos os `id` de questão seguem o padrão `{trilha}-{modulo}-q{n}` (ex: `basica-08-q3`), garantindo unicidade para tracking de progresso/XP no backend.

**Nunca sirva esses objetos de questão direto para o cliente** — `correta`, `resposta_correta`, `etapas_corretas` e a ordem de `pares` revelam o gabarito. Toda rota que expõe conteúdo passa por `sanitizarQuestaoParaCliente()` (`src/lib/content.ts`) antes de responder.

## Observações para a Fase 2 (Backend) — atualizado

- Cada módulo é auto-contido — pode ser importado/seedado individualmente.
- `modulo_id` e `id` de questão são as chaves estáveis para relacionar progresso do usuário, XP e conquistas.
- Os campos `explicacao`, `explicacao_acerto` e `explicacao_erro` devem ser exibidos como feedback imediato após a resposta — são parte do desenho pedagógico, não texto opcional.
- `src/lib/content.ts` (`todasQuestoesDoModulo`) lê tanto `aulas[].atividade` quanto `atividade_final` como uma lista única de questões — é essa lista que valida se um módulo foi realmente concluído antes de conceder badge/certificado (ver `docs/gamificacao.md`).
