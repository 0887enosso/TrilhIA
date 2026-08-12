# Trilha Intermediária — Letramento em IA

Documentação de conteúdo programático da **Trilha Intermediária**, sequência da Trilha Básica. Pré-requisito: conclusão da Trilha Básica (10 módulos).

## Visão geral

- **Objetivo:** aprofundar prompt engineering, uso de ferramentas no dia a dia jurídico, conceitos técnicos essenciais (sem programação) e automação/API Keys — fechando com um projeto prático aplicado.
- **Formato:** 30 módulos em 5 blocos temáticos + 1 módulo final de projeto prático.
- **Blocos:** A) Prompt Engineering (6) · B) Ferramentas do dia a dia (6) · C) IA generativa aplicada ao trabalho jurídico (5) · D) Conceitos técnicos essenciais (6) · E) Integrações, automação e API Keys (6) · Módulo 30) Projeto prático final.

## Correções incorporadas desde a origem (pós-revisão pedagógica)

Esta trilha foi desenhada já incorporando os achados do relatório `/mnt/user-data/outputs/revisao-pedagogica-trilhas.md`, evitando o retrabalho que seria necessário se essas correções fossem aplicadas depois dos 30 arquivos prontos:

1. **Sem sequência fixa de tipos de questão por módulo** — diferente da primeira versão da trilha básica, cada módulo aqui varia deliberadamente a ordem e a combinação de tipos.
2. **Dois novos tipos de questão**, detalhados abaixo: `correcao_prompt` (fecha a lacuna entre o Bloco A ensinar prompt engineering e nunca avaliar isso de forma aplicada) e `resposta_curta_autoavaliada` (introduz produção ativa gradual, preparando o colaborador para o projeto prático do Módulo 30, em vez de exigir esse salto sem precedente).
3. **Conquista de bloco** — o último módulo de cada bloco inclui um campo `conquista_de_bloco`, com nome e descrição de uma badge, para marcar a passagem entre blocos com um momento de reconhecimento (especialmente relevante nos blocos D e E, mais técnicos e com maior risco de fadiga).
4. **Revisão espaçada contínua** — assim como na trilha básica, questões podem carregar o campo opcional `"revisao_de": "{modulo_id}"` quando reativam um conceito de um módulo anterior.

## Schema de cada módulo

Segue a mesma estrutura documentada no README da Trilha Básica (`modulo_id`, `trilha`, `ordem`, `titulo`, `descricao_curta`, `tempo_estimado_min`, `objetivos_aprendizagem`, **`aulas` com atividade embutida, `atividade_final`** — atualizado na Fase 2, ver o README da básica para o racional completo da mudança), com os seguintes acréscimos:

### Tipos de questão adicionais

**`correcao_prompt`** — apresenta um prompt fictício com um problema real, e pede diagnóstico ou reformulação:
```jsonc
{
  "id": "string",
  "tipo": "correcao_prompt",
  "enunciado": "string",
  "prompt_analisado": "o prompt fictício com o problema",
  "alternativas": [{"id","texto","correta"}],
  "explicacao_acerto": "string",
  "explicacao_erro": "string"
}
```

**`resposta_curta_autoavaliada`** — pergunta aberta curta (1-2 frases), sem alternativa certa/errada fixa; o colaborador escreve e depois se autoavalia contra critérios dados:
```jsonc
{
  "id": "string",
  "tipo": "resposta_curta_autoavaliada",
  "enunciado": "string",
  "criterios_autoavaliacao": ["string", "string"],
  "exemplo_de_resposta_forte": "string (mostrado só depois que o usuário responde, nunca antes)"
}
```

### Campo opcional em qualquer módulo

```jsonc
"conquista_de_bloco": {
  "bloco": "A",
  "nome_badge": "string",
  "descricao": "string"
}
```
Presente apenas no último módulo de cada bloco (Módulos 6, 12, 17, 23 e 29).

## Estrutura dos arquivos

```
trilha-intermediaria/
├── README.md
└── modulos/
    ├── modulo-01.json ... modulo-30.json
```

## Status de geração

**Completo.** Todos os 30 módulos gerados e validados (Blocos A-E + Módulo 30, o projeto prático final).

## Schema especial do Módulo 30 (projeto prático final)

O Módulo 30 foge do schema padrão — não tem `questoes` no formato de quiz. Em vez disso:

```jsonc
{
  "tipo_modulo": "projeto_pratico",
  "instrucoes": "string",
  "casos": [
    {
      "caso_id": "string",
      "titulo": "string",
      "dossie": "string (contexto fictício do caso)",
      "tarefas": ["string", "string", ...]
    }
  ],
  "checklist_autoavaliacao": ["string", ...],
  "conquista_final": {
    "nome_badge": "string",
    "descricao": "string",
    "certificado_elegivel": true,
    "titulo_certificado": "string",
    "texto_base_certificado": "string (com placeholder {nome_do_usuario})"
  }
}
```

O frontend deve sortear ou permitir escolha entre os `casos`, exibir as `tarefas` como um fluxo guiado de campos abertos (não múltipla escolha), e ao final apresentar o `checklist_autoavaliacao` para autoavaliação do próprio usuário — sem gabarito certo/errado.
