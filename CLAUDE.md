# CLAUDE.md — TrilhIA

Este arquivo orienta qualquer sessão do Claude Code trabalhando neste projeto. Leia-o antes de qualquer alteração.

## Sobre o projeto

Aplicativo de letramento em Inteligência Artificial para colaboradores de um escritório de advocacia (estagiários, assistentes jurídicos e advogados), no formato de aprendizado gamificado (modelo Duolingo). Objetivo: alfabetização em IA, do "o que é IA" até uso técnico aplicado (prompt engineering, ferramentas do dia a dia, automações e API Keys) — sem transformar o colaborador em desenvolvedor.

**Nome do produto:** TrilhIA.

## Público-alvo

Colaboradores de escritório de advocacia com pouca ou nenhuma vivência prática com IA, mas com alguma noção geral do tema. Conteúdo deve ser generalista (não amarrado a nenhuma ferramenta específica que o escritório já usa) e sempre ancorado no propósito e na rotina de um ambiente jurídico.

## Fases do projeto

| Fase | Escopo | Status |
|---|---|---|
| 1 — Conteúdo | Estruturação de trilhas, módulos e banco de questões | Completa |
| 2 — Backend | Modelagem de dados, API, lógica de progresso/gamificação | **Completa** (API funcional; sem testes automatizados ainda) |
| 3 — Frontend | Interface do aplicativo | **Implementada** (todas as telas do fluxo do colaborador + painel admin; falta rodar `npm install`/`npm run build` de verdade e testar no navegador) |

### Status detalhado da Fase 1 (encerrada)

- **Trilha Básica** (10 módulos, letramento): completa, revisada pedagogicamente. `content/trilha-basica/`
- **Trilha Intermediária** (30 módulos, nível técnico/aplicado): completa — Blocos A a E (29 módulos de quiz) + Módulo 30 (projeto prático final, schema próprio). `content/trilha-intermediaria/`
- Conteúdo de transição entre as duas trilhas (tela de celebração, badge, certificado): pronto em `content/transicoes/`.
- Total: 40 módulos de conteúdo, 273 questões (70 da trilha básica + 203 da trilha intermediária), 6 badges de conquista de bloco/trilha definidas.

### Status detalhado da Fase 2 (completa)

- **Schema de dados:** `prisma/schema.prisma`, racional completo em `docs/modelagem-dados.md`.
- Decisão-chave: conteúdo (módulos/questões) não é migrado para o banco — o backend lê `content/*.json` diretamente como fonte de verdade. O banco só armazena progresso, XP, ligas e conquistas, referenciando o conteúdo pelos IDs estáveis definidos na Fase 1.
- **Infraestrutura:** Next.js (API routes, sem serviço separado) + Vercel (deploy + Cron) + Supabase (PostgreSQL gerenciado). Repositório criado do zero.
- **Autenticação:** nickname/senha (não e-mail — trocado nesta rodada) com sessão via cookie httpOnly (JWT assinado, `src/lib/auth.ts`). Sem serviço de e-mail transacional — recuperação de senha é assistida por admin. Cadastro novo nasce `statusCadastro: PENDENTE` e só ganha acesso depois que um admin aprova pelo painel — substitui a antiga restrição por domínio de e-mail.
- **21 rotas de API implementadas**, cobrindo cadastro (com rate limiting e restrição de domínio opcional), autenticação (com invalidação de sessão ao trocar senha), conteúdo sanitizado, progresso de módulo/questão/projeto final (incluindo progresso agregado das duas trilhas), conquistas/certificados, desafio diário, painel administrativo (incluindo criar equipes/ligas e promover/ativar usuários) e apuração semanal de ligas via Vercel Cron. Lista completa em `README.md`.
- **Gamificação implementada:** XP por tipo de questão, corações com reset por módulo, streak diário com freeze, ligas por equipe + ligas exclusivas com condição de desbloqueio, badges de bloco/trilha, emissão de certificado, estrelas diárias (2 módulos novos por dia) e desafio diário (5 questões de conteúdo já visto, +30 XP de bônus). Detalhes em `docs/gamificacao.md` e `docs/modelagem-dados.md`.
- **Auditoria técnica realizada em duas rodadas** (`docs/auditoria-tecnica-backend.md`) — todos os achados de prioridade Crítica e Alta corrigidos, e a maioria dos de prioridade Média (Módulo 30 sem captura de dado, senha temporária com aleatoriedade insegura, sessão não invalidada no reset, cadastro sem restrição de domínio, sem rate limiting, sem usuário ativo/inativo).
- **Testes unitários** para as funções mais críticas (validação de resposta por tipo de questão, sanitização de gabarito, XP/nível/semana ISO) em `src/lib/__tests__/`, rodáveis com `npm test`. Escritos e validados sintaticamente, mas não executados de fato — o ambiente onde este projeto foi gerado teve erro de I/O ao instalar `node_modules` (limitação do sandbox, não do código). Rode `npm install && npm test` antes de confiar neles.
- **Pendências conhecidas (não bloqueiam o uso):** log estruturado/observabilidade, testes de integração com banco, `ProgressoModulo.xpGanho` nunca preenchido (campo morto), `atualizarStreak()` não é chamado no fluxo do Módulo 30, resposta bruta do usuário não é persistida (perde dado de analytics de conteúdo), rate limit de IP em `src/lib/rateLimiter.ts` confia em `x-forwarded-for` (forjável pelo cliente).

### Status detalhado da Fase 3 (implementada nesta rodada)

- **Stack:** Next.js App Router + Tailwind, sem dependências novas. Leituras de página são Server Components chamando `src/lib/*.ts` direto (mesmas funções que as rotas `GET` usam); mutações são Client Components que chamam as rotas de API existentes via `fetch`. Detalhes e racional completo em `docs/frontend.md`.
- **Mascote:** sistema de 8 poses em SVG (`src/components/mascote/`) — as 4 originais enviadas foram **redesenhadas** (o rascunho seguia de perto uma minifigura licenciada; a versão implementada tem figurino, cores e acessórios próprios, mesma "esqueleto" de boneco articulado) e 4 novas foram criadas (`pensando`, `cansado`, `certificado`, `sentado`). Arte é vetorial simples — serve para o produto funcionar, mas não substitui um acabamento final de design.
- **Novo endpoint:** `GET /api/ligas` (ranking semanal do usuário logado — só existia leitura de ranking pelo painel admin).
- **Todas as telas do fluxo do colaborador implementadas:** login/cadastro/troca de senha, início (dashboard), mapa de trilha, módulo (aulas + 7 tipos de questão + módulo 30 com fluxo próprio), desafio diário, conquistas/certificado (com impressão), liga. Painel admin: usuários (promover/rebaixar, ativar/desativar, resetar senha), equipes, ligas.
- **Não verificado neste ambiente:** o sandbox usado não tem `node_modules` instalado (mesma limitação já registrada para a Fase 2) — o código não foi compilado nem testado no navegador. Rode `npm install && npm run dev` e navegue pelo fluxo completo antes de considerar a Fase 3 fechada.

## Estrutura de pastas

```
trilhia/
├── CLAUDE.md                          (este arquivo)
├── README.md                          (setup local, rotas de API — leia antes de rodar o projeto)
├── package.json / tsconfig.json / next.config.mjs / tailwind.config.ts
├── .env.example                       (variáveis de ambiente necessárias — Supabase, JWT_SECRET)
├── docs/
│   ├── revisao-pedagogica-trilhas.md  (auditoria de qualidade do conteúdo — critérios aplicados)
│   ├── gamificacao.md                 (especificação de XP, streaks, ligas, badges, certificados)
│   ├── stack-tecnica.md               (stack escolhida e convenções que o backend deve seguir)
│   ├── modelagem-dados.md             (racional do schema Prisma — leia antes de alterar o schema)
│   ├── frontend.md                    (arquitetura de telas, sistema do mascote, decisões da Fase 3)
│   └── implantacao.md                 (guia passo a passo: Claude Code local, Supabase, deploy na Vercel)
├── vercel.json                        (config do Vercel Cron — apuração semanal)
├── prisma/
│   ├── schema.prisma                  (schema de dados — usuários, progresso, ligas, conquistas)
│   └── seed.ts                        (dados iniciais: 3 equipes, ligas, admin)
├── src/
│   ├── app/
│   │   ├── api/                       (21 rotas de API — ver README.md para lista completa)
│   │   ├── (auth)/                    (login, cadastro — layout sem header do app)
│   │   ├── (app)/                     (início, trilha, módulo, desafio diário, conquistas, liga — layout com header/streak/corações)
│   │   ├── admin/                     (painel administrativo — layout próprio)
│   │   ├── trocar-senha/
│   │   ├── layout.tsx / page.tsx      (layout raiz + redirect para /inicio ou /login)
│   │   └── globals.css
│   ├── components/
│   │   ├── mascote/                   (sprite SVG de 8 poses + componente <Mascote pose="..." />)
│   │   ├── ui/                        (Botao, Campo, Coracoes, EstrelasDiarias, StreakBadge, BadgePill)
│   │   ├── app/                       (Header, NavLinks, LogoutButton — shell autenticado)
│   │   ├── auth/                      (formulários de login/cadastro/troca de senha)
│   │   ├── trilha/                    (MapaTrilha)
│   │   ├── quiz/                      (CartaoQuestao — 7 tipos, ModuloClient, DesafioClient, ProjetoFinalFlow)
│   │   └── admin/                     (UsuariosTable, formulários de equipe/liga)
│   ├── lib/
│   │   ├── prisma.ts                  (singleton do cliente Prisma)
│   │   ├── auth.ts                    (hash de senha, sessão JWT, geração de senha temporária)
│   │   ├── content.ts                 (lê o conteúdo JSON e valida respostas — a ponte entre conteúdo e API)
│   │   ├── xp.ts                      (tabela de XP por tipo de questão, fórmula de nível)
│   │   ├── streak.ts                  (streak diário e consumo de freeze)
│   │   ├── ligas.ts                   (semana ISO, elegibilidade de liga, distribuição e ranking de XP semanal)
│   │   ├── limiteDiario.ts            (estrelas diárias — 2 módulos novos por dia)
│   │   ├── desafioDiario.ts           (seleção de questões e bônus do desafio diário)
│   │   ├── rateLimiter.ts             (limite de tentativas de login/cadastro)
│   │   ├── conquistas.ts              (badges de bloco/trilha, emissão de certificado, leitura para o frontend)
│   │   ├── progresso.ts               (progresso agregado — usado pela rota e pelas páginas)
│   │   ├── usuario.ts                 (resumo do usuário — usado pela rota /api/auth/me e pelo layout autenticado)
│   │   ├── admin.ts                   (listagem de usuários para o painel admin)
│   │   └── __tests__/                 (testes unitários — npm test)
│   └── middleware.ts                  (proteção de /api/admin/* — guarda das páginas fica nos layouts)
├── vitest.config.ts
├── scripts/
│   └── migrar_schema_conteudo.py      (migração histórica de conteudo/questoes para aulas/atividade_final)
└── content/
    ├── trilha-basica/
    │   ├── README.md                  (schema, guia de voz/tom, critérios de qualidade)
    │   └── modulos/modulo-01.json ... modulo-10.json
    ├── trilha-intermediaria/
    │   ├── README.md                  (schema estendido, incluindo tipos de questão novos e schema do módulo 30)
    │   └── modulos/modulo-01.json ... modulo-30.json  (completo — Blocos A-E + projeto prático final)
    └── transicoes/
        └── transicao-trilha-basica-para-intermediaria.json
```

## Como o conteúdo está modelado

Cada módulo é um JSON auto-contido: metadados (`modulo_id`, `ordem`, `titulo`, `objetivos_aprendizagem`) e uma sequência de **aulas curtas** (`aulas[]`), cada uma com seu próprio texto e uma atividade de fixação embutida logo em seguida (`aulas[].atividade`) — mais uma **atividade final** maior ao término do módulo (`atividade_final`), integrando o tema inteiro. Esse formato existe para seguir a mecânica do Duolingo: ensino curto + fixação imediata, nunca uma leitura longa seguida de um quiz enorme no final. O schema completo de cada tipo de questão está documentado nos `README.md` de cada trilha — **consulte-os antes de gerar ou modificar qualquer módulo**, em vez de inferir o formato só olhando um exemplo.

Tipos de questão existentes: `multipla_escolha`, `verdadeiro_falso`, `associacao`, `completar_lacuna`, `ordenar_etapas` (todos usados na Trilha Básica), mais `correcao_prompt` e `resposta_curta_autoavaliada` (introduzidos na Trilha Intermediária).

**Nunca sirva um objeto de questão bruto (de `carregarModulo`/`buscarQuestao`) direto para o cliente** — ele contém o gabarito. Toda rota que expõe conteúdo passa por `sanitizarQuestaoParaCliente()` (`src/lib/content.ts`) antes de responder.

## Padrões de qualidade de conteúdo (não negociáveis)

Ver `docs/revisao-pedagogica-trilhas.md` para o racional completo. Resumo do que deve ser seguido em qualquer conteúdo novo:

- Alternativas de múltipla escolha e V/F devem ter extensão e nível de detalhe equivalentes entre si — a resposta certa nunca deve ser identificável só pelo tamanho.
- Distratores (alternativas erradas) devem representar erros plausíveis e reais que alguém sem o letramento cometeria — nunca opções absurdas ou irrelevantes.
- Nenhum módulo deve repetir a mesma sequência de tipos de questão do módulo anterior.
- Toda questão de reconhecimento (múltipla escolha, V/F etc.) deve ter explicação de acerto e/ou erro — o feedback também ensina, não é só validação.
- Tom de voz: sempre "você", frases curtas, ganchos antes da explicação, analogias do cotidiano, conexões explícitas entre módulos.

## Gamificação e stack técnica

Não decida esses pontos por conta própria — ambos já têm decisões de produto registradas:
- `docs/gamificacao.md` — mecânica de XP, streaks, ligas, badges e certificados.
- `docs/stack-tecnica.md` — stack escolhida (Next.js + TypeScript + Tailwind + Prisma + PostgreSQL), decisão de web app standalone (sem SSO), e convenções que a modelagem de banco de dados precisa preservar do conteúdo já criado.

## Regras de escopo do produto

- O aplicativo ensina letramento e uso de IA — **não** ensina programação nem forma desenvolvedores. Mesmo os módulos mais técnicos (Bloco D e E da Trilha Intermediária) são conceituais, sem código.
- Nunca usar dados reais de clientes do escritório em nenhum exemplo, caso de teste ou seed de banco — todo exemplo jurídico no conteúdo é fictício por design (ver Módulo 9 da Trilha Básica, que trata exatamente desse princípio).
