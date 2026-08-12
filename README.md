# TrilhIA

Aplicativo de letramento em Inteligência Artificial para colaboradores do escritório, no formato de aprendizado gamificado.

> Para contexto completo do projeto (fases, decisões de produto, conteúdo pedagógico), veja `CLAUDE.md` e a pasta `docs/`. Este README cobre só o setup técnico local.

## Pré-requisitos

- Node.js 20+
- Um projeto Supabase criado (para o PostgreSQL gerenciado)

## Configuração local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase (Configurações > Database > Connection string):
   ```bash
   cp .env.example .env
   ```

3. Gere o cliente Prisma e aplique o schema ao banco:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Rode o seed inicial (cria as 3 equipes, as ligas padrão/exclusiva de exemplo, e um admin inicial):
   ```bash
   npm run prisma:seed
   ```
   **Anote a senha temporária do admin exibida no terminal** — ela não é salva em nenhum lugar além do hash, e não será exibida de novo.

5. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O app sobe em `http://localhost:3000`.

## Estrutura do projeto

```
trilhia/
├── CLAUDE.md              contexto do projeto para Claude Code
├── docs/                  decisões de produto (conteúdo, gamificação, stack, dados)
├── content/                conteúdo pedagógico das trilhas (JSON, fonte de verdade)
├── prisma/
│   ├── schema.prisma      schema do banco (usuários, progresso, ligas, conquistas)
│   └── seed.ts            dados iniciais (equipes, ligas, admin)
└── src/
    ├── app/
    │   ├── api/           rotas de API (Next.js Route Handlers)
    │   ├── (auth)/        login, cadastro
    │   ├── (app)/         início, trilha, módulo, desafio diário, conquistas, liga
    │   └── admin/         painel administrativo
    ├── components/        mascote, UI compartilhada, quiz, trilha, admin — ver docs/frontend.md
    ├── lib/                autenticação, cliente Prisma, lógica de progresso/gamificação
    └── middleware.ts      proteção de rotas /api/admin/* (páginas são protegidas nos próprios layouts)
```

## Rotas de API implementadas

| Rota | Método | Auth | Descrição |
|---|---|---|---|
| `/api/equipes` | GET | pública | Lista as equipes (para o formulário de cadastro) |
| `/api/auth/register` | POST | pública (rate limited) | Cadastra novo colaborador por nome + nickname + senha (sempre papel COLABORADOR, sempre `statusCadastro: PENDENTE` — não loga automaticamente) |
| `/api/auth/login` | POST | pública (rate limited) | Autentica por nickname/senha, define cookie de sessão; bloqueia conta desativada ou com cadastro pendente/rejeitado |
| `/api/auth/logout` | POST | pública | Encerra a sessão |
| `/api/auth/me` | GET | sessão | Retorna os dados do usuário autenticado, incluindo estrelas diárias restantes |
| `/api/auth/change-password` | POST | sessão | Usuário troca a própria senha (usado após reset pelo admin) e recebe uma sessão nova |
| `/api/trilhas/[trilha]/modulos/[moduloId]` | GET | sessão | Conteúdo sanitizado do módulo (aulas + atividades) — só após `iniciar` |
| `/api/progresso` | GET | sessão | Progresso agregado nas duas trilhas — status de cada módulo (não iniciado / em andamento / concluído), para montar o mapa de trilha |
| `/api/conquistas` | GET | sessão | Badges conquistadas e certificados emitidos do usuário logado, com texto do certificado já pronto para exibição |
| `/api/progresso/modulo/iniciar` | POST | sessão | Inicia/reabre um módulo, reseta corações, consome estrela diária se for módulo novo |
| `/api/progresso/questao/responder` | POST | sessão | Valida resposta, concede XP (sem duplicar), atualiza corações/streak/desafio diário |
| `/api/progresso/modulo/concluir` | POST | sessão | Marca módulo concluído **só se todas as questões (ou a entrega do projeto final) já foram registradas**, processa badges/certificados |
| `/api/progresso/projeto-final` | POST | sessão | Registra a entrega do Módulo 30 (caso escolhido, respostas das tarefas, checklist) |
| `/api/desafio-diario` | GET | sessão | Desafio do dia (5 questões de módulos já vistos) — cria se ainda não existir hoje |
| `/api/admin/reset-password` | POST | admin | Gera senha temporária para outro usuário; expulsa sessões já abertas dele |
| `/api/admin/usuarios` | GET | admin | Lista colaboradores com resumo de progresso |
| `/api/admin/usuarios/[usuarioId]` | PATCH | admin | Promove/rebaixa papel (COLABORADOR ↔ ADMIN), ativa/desativa conta, e aprova/rejeita cadastro pendente (`statusCadastro`) |
| `/api/admin/equipes` | GET / POST | admin | Lista equipes / cria equipe nova (já provisiona a liga padrão dela) |
| `/api/admin/ligas` | GET / POST | admin | Lista ligas / cria liga customizada (ex: nova liga exclusiva) |
| `/api/admin/ligas/[ligaId]/ranking` | GET | admin | Ranking da semana corrente de uma liga |
| `/api/ligas` | GET | sessão | Ranking da semana corrente nas ligas em que o usuário logado pontua |
| `/api/cron/semanal` | GET | `CRON_SECRET` | Apura ranking semanal das ligas + repõe streak freeze (Vercel Cron, ver `vercel.json`) |

Todos os endpoints de progresso validam a resposta do usuário lendo o conteúdo diretamente de `content/*.json` (`src/lib/content.ts`) — nunca confiam em um "correta: true/false" vindo do cliente. Conteúdo servido ao cliente sempre passa por `sanitizarQuestaoParaCliente()` antes de sair — nunca envie um módulo carregado por `carregarModulo()` direto na resposta.

## Testes automatizados

`npm test` roda os testes unitários (`vitest`) das funções mais críticas: validação de resposta por tipo de questão, sanitização de gabarito e cálculo de XP/nível/semana ISO — ver `src/lib/__tests__/`. Cobrem só lógica pura por enquanto (sem banco); testes de integração ficam como próximo passo.

> **Nota:** os testes foram escritos e validados sintaticamente, mas não foi possível executá-los de fato no ambiente onde este projeto foi gerado (erro de I/O do sandbox ao instalar `node_modules`, não relacionado ao código). Rode `npm install && npm test` no seu ambiente antes de confiar neles.

## Mecânica de módulo (estilo Duolingo — atualizado)

Cada módulo virou uma sequência de **aulas curtas**, cada uma com sua própria atividade de fixação logo em seguida (`aulas[].atividade`), e uma **atividade final maior** ao término, integrando o tema inteiro (`atividade_final`). Ver `content/trilha-basica/README.md` para o schema completo e o racional da mudança — resume-se a: nada de ler um módulo inteiro para só depois enfrentar um quiz enorme no final.

Além disso, dois limitadores diários (documentados em `docs/gamificacao.md`):
- **Estrelas diárias:** só 2 módulos novos por dia. Reabrir um módulo já iniciado é sempre livre.
- **Desafio diário:** 5 questões de conteúdo já visto, disponível mesmo depois de esgotadas as estrelas do dia — não consome estrela, só reforça o que já foi aprendido, com bônus de XP.

## Cadastro por nickname e aprovação de admin

O login não usa e-mail — usa **nickname** (identificador único, sempre normalizado para minúsculas). Cadastro (`POST /api/auth/register`) pede só nome completo, nickname, senha e equipe, e **não loga automaticamente**: toda conta nasce com `statusCadastro: PENDENTE` e só consegue entrar depois que um admin aprova pelo painel (`/admin/usuarios`, seção "Aguardando aprovação", ou `PATCH /api/admin/usuarios/[usuarioId]` com `{ "statusCadastro": "APROVADO" }`). Substituiu a antiga restrição por domínio de e-mail (`DOMINIOS_EMAIL_PERMITIDOS`, removida) — mecanismo mais forte, já que nem e-mail é mais coletado.

## Frontend (Fase 3)

Todas as telas do fluxo do colaborador (login, início, mapa de trilha, módulo, desafio diário, conquistas/certificado, liga) e do painel admin (usuários, equipes, ligas) estão implementadas em `src/app/` + `src/components/`. Arquitetura de dados, sistema do mascote e o que ainda falta de polimento: `docs/frontend.md`.

## Próximos passos sugeridos (fora do escopo já implementado)

- Executar `npm install && npm run dev` de verdade num ambiente sem as limitações do sandbox usado para gerar este projeto — nem o backend nem o frontend foram compilados/testados no navegador aqui — e navegar pelo fluxo completo (cadastro → módulo → conclusão → conquistas) antes de confiar no código.
- Testes de integração (com banco) além dos testes unitários já escritos.
- Arte final do mascote e testes end-to-end da interface — ver "o que fica para depois" em `docs/frontend.md`.
