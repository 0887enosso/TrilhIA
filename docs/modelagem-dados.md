# Modelagem de Dados — Fase 2 (Backend)

Explica as decisões por trás de `prisma/schema.prisma`, para quem for revisar ou continuar a implementação.

## Decisão central: conteúdo fora do banco

`ProgressoModulo` e `RespostaQuestao` guardam apenas o **ID em texto** do módulo/questão (`moduloId`, `questaoId`), não uma chave estrangeira para uma tabela de conteúdo — porque essa tabela não existe. O backend lê `content/*.json` diretamente para saber o que é cada módulo/questão, e usa o banco só para saber **o que o usuário já fez**.

Vantagem: editar conteúdo (corrigir uma questão, adicionar um módulo) nunca exige migração de banco. Isso só funciona porque os IDs do conteúdo são estáveis desde a Fase 1 — não renomeie `modulo_id` ou `id` de questão em conteúdo já publicado, ou o histórico de progresso dos usuários perde a referência.

## Por que `RespostaQuestao` guarda `tipoQuestao` duplicado

O tipo da questão (`multipla_escolha`, `correcao_prompt`, etc.) já está no JSON, mas duplicá-lo na resposta evita ter que reabrir o JSON toda vez que for calcular relatórios como "XP ganho por tipo de questão" — pequeno ganho de performance em troca de um campo redundante, aceitável nesse caso.

## Ligas: um modelo para dois casos

`Liga` cobre tanto as ligas padrão por equipe (Banco BMG, Banco Pine, C6 Bank) quanto as ligas exclusivas (desbloqueadas por conclusão de trilha), usando dois campos:
- `equipeId` nulo → liga cross-team (ex: uma liga exclusiva geral, sem separação por equipe).
- `condicaoDesbloqueio` nulo → sem restrição (caso padrão).

Isso evita duas tabelas quase idênticas e deixa a porta aberta para outras condições de desbloqueio no futuro (ex: `"trilha_intermediaria_concluida"`), sem mudar o schema — só a lógica de aplicação que interpreta essa string.

`ParticipacaoLiga` guarda XP **por semana**, não o XP total do usuário — é o que permite a lógica de subida/descida de liga rodar semana a semana, independente do XP histórico total (`Usuario.xpTotal`, esse sim acumulado para sempre).

## Fluxo de recuperação de senha (implementado)

`Usuario.precisaTrocarSenha` suporta o fluxo decidido com o time: sem e-mail transacional, o admin gera uma senha temporária pelo endpoint `POST /api/admin/reset-password`, o campo vira `true`, e o próprio usuário troca a senha em `POST /api/auth/change-password` no próximo login (que zera o campo de volta). A senha temporária nunca é persistida em texto puro — só o hash dela.

## Estrelas diárias: por que duas atualizações atômicas, não uma transação

`src/lib/limiteDiario.ts` usa duas chamadas `updateMany` com `WHERE` condicional em vez de "ler o contador, decidir em memória, escrever" — de propósito. Cada `updateMany` é avaliado pelo Postgres no momento exato da escrita, então mesmo duas requisições chegando juntas não conseguem as duas "verem" a mesma vaga livre e consumi-la em duplicidade. Esse é o mesmo padrão usado para corrigir a condição de corrida de XP (ver seção de correções abaixo) — vale como referência para qualquer contador futuro que precise ser seguro sob concorrência.

## Desafio diário: reaproveita questões, não duplica conteúdo

`DesafioDiario.questaoIds` guarda só os IDs sorteados (ex: `["basica-03-q2", "basica-03-q5"]`) — nunca uma cópia do conteúdo da questão. `trilha` e `moduloId` são derivados do próprio ID via `parseQuestaoId()` (`src/lib/content.ts`), aproveitando que o formato de ID já embute essa informação (`{trilha}-{modulo}-q{n}`). As questões do desafio são sempre de módulos que o usuário já iniciou antes — nunca introduz conteúdo novo, então concluir o desafio não consome estrela diária nem "adianta" progresso na trilha.

## `XpConcedido`: constraint de banco no lugar de checagem em aplicação

Uma tabela pequena e de propósito único: cada linha significa "usuário X já foi creditado com XP pela questão Y, definitivamente". A constraint `@@unique([usuarioId, questaoId])` é o mecanismo de exclusão mútua — sob duas requisições concorrentes para a mesma questão, as duas tentam criar essa linha, só uma consegue, a outra recebe erro de constraint (`P2002`) e sabe que deve pular a concessão de XP. Substituiu uma checagem em aplicação (`count` + `findFirst` antes de decidir) que tinha uma condição de corrida real — ver próxima seção.

## Correções aplicadas da auditoria técnica (`docs/auditoria-tecnica-backend.md`)

Nesta rodada, quatro dos achados da auditoria foram corrigidos:

- **#2.1 (crítico) — concluir módulo sem checar respostas:** `POST /api/progresso/modulo/concluir` agora chama `moduloFoiRealizado()` (`src/lib/content.ts`), que verifica se existe pelo menos uma resposta correta (ou, para `resposta_curta_autoavaliada`, qualquer resposta) para **cada** questão do módulo — juntando `aulas[].atividade` e `atividade_final` numa lista única via `todasQuestoesDoModulo()`. Sem isso, badge e certificado não significam mais nada.
- **#1.1 (crítico) — corrida de XP:** substituído o cálculo em memória (`xpTotal + xpGanho`) por `increment` atômico do Prisma, e a checagem de "já ganhou XP" por `XpConcedido` (ver acima).
- **#1.2 (alto) — corações negativos:** decremento agora usa `updateMany` com `WHERE coracoesAtuais > 0`, condição e escrita no mesmo comando — nunca fica abaixo de zero, mesmo sob concorrência.
- **#1.3 (alto) — XP em dobro:** resolvido pelo mesmo mecanismo de `XpConcedido` do item #1.1.

Os achados de prioridade média/baixa da auditoria (rate limiting, restrição de domínio no cadastro, invalidação de sessão no reset de senha, campo de usuário ativo/inativo, captura de dado do Módulo 30) seguem pendentes — não foram tocados nesta rodada, que focou em conteúdo (aulas/atividade final) e nos dois mecanismos novos de gamificação.

## Correções aplicadas da auditoria técnica — 2ª rodada

- **#4 — Módulo 30 sem captura de dado:** novo model `EntregaProjetoFinal` (`usuarioId`, `moduloId`, `casoId`, `respostasTarefas` e `checklistMarcado` como `Json`). `POST /api/progresso/projeto-final` valida a entrega contra o conteúdo real do módulo 30 (número de tarefas do caso escolhido, número de itens do checklist) antes de salvar. `POST /api/progresso/modulo/concluir` agora exige essa entrega para o módulo 30, no mesmo espírito da correção #2.1 para os demais módulos.
- **#5.1 — `Math.random()` em senha temporária:** trocado por `crypto.randomInt()` em `src/lib/auth.ts`.
- **#5.2 — reset de senha não invalidava sessão:** `Usuario.senhaAlteradaEm` agora é embutido no JWT (`senhaVersao`) e comparado contra o banco em toda chamada de `obterSessaoAtual()`. Qualquer troca ou reset de senha muda esse timestamp, invalidando sessões antigas automaticamente — sem precisar de uma lista de revogação separada. A rota `change-password` reemite a sessão do próprio usuário na hora (para ele não se autodeslogar), mas `admin/reset-password` não reemite nada — o objetivo ali é justamente expulsar sessões existentes.
- **#5.3 — cadastro sem restrição de domínio:** agora configurável via `DOMINIOS_EMAIL_PERMITIDOS` (variável de ambiente, opcional). Sem ela definida, comportamento inalterado (qualquer domínio aceito) — o escritório ainda não definiu um domínio único.
- **#5.4 — sem rate limiting:** `src/lib/rateLimiter.ts`, baseado em tabela própria (`TentativaAcesso`), sem dependência externa. Login: 5 tentativas/15 min por e-mail. Cadastro: 10/hora por IP.
- **#5.5 — sem usuário ativo/inativo:** campo `Usuario.ativo` (default `true`), checado no login. `PATCH /api/admin/usuarios/[usuarioId]` ativa/desativa (e também promove/rebaixa entre COLABORADOR e ADMIN — resolve de brinde o antigo "próximo passo" de endpoint de promoção a admin).

Também foram adicionados, fora do escopo original da auditoria mas na mesma leva: `POST /api/admin/equipes` e `POST /api/admin/ligas`, para criar equipes e ligas pelo painel em vez de só via seed.

## O que era só lógica de aplicação (agora implementado)

Esta seção listava, na primeira versão deste documento, o que o schema por si só não resolvia. Todos os pontos abaixo foram implementados desde então — mantidos aqui como referência de onde encontrar cada lógica:

- **Apuração semanal de ligas**: `src/app/api/cron/semanal/route.ts`, acionado pelo Vercel Cron (`vercel.json`). Como cada equipe tem uma única liga, a apuração só define `posicaoFinal` — não há lógica de promoção/rebaixamento entre escalões (racional completo em `docs/gamificacao.md`).
- **Reset de corações**: `src/app/api/progresso/modulo/iniciar/route.ts`, chamado pelo frontend ao abrir um módulo.
- **Streak diário e consumo de freeze**: `src/lib/streak.ts`, chamado a cada resposta de questão. Reposição semanal do freeze acontece no mesmo cron da apuração de ligas.
- **Desbloqueio de liga exclusiva**: `src/lib/ligas.ts` (`ligasElegiveis`), consultado sempre que XP é concedido, para saber em quais ligas creditar.
- **Validação de resposta contra o conteúdo**: `src/lib/content.ts` (`validarResposta`) — o backend nunca confia em um "correta: true/false" vindo do cliente, sempre recalcula a partir do JSON do módulo.
- **Concessão de badges e certificados**: `src/lib/conquistas.ts`, chamado ao concluir um módulo.

## Correções encontradas testando de ponta a ponta contra um banco real (2026-08-11)

Até esta rodada, o backend nunca tinha sido exercitado contra um banco de verdade (só testes unitários de lógica pura). Ao testar o fluxo completo (cadastro → iniciar módulo → responder → concluir → desafio diário → liga) contra um Supabase real, dois bugs de fato apareceram — nenhum dos dois visível olhando o código isoladamente ou nos testes unitários existentes:

- **`carregarModulo()` usava o `moduloId` recebido como nome de arquivo literal** (`${moduloId}.json`), mas os arquivos em disco são `modulo-01.json`...`modulo-30.json`, enquanto o `modulo_id` estável documentado nesta seção (`basica-01`, `intermediaria-13`) é um campo *dentro* do JSON — os dois nunca foram o mesmo valor. Isso quebrava `POST /api/progresso/modulo/iniciar` sempre que chamado com o `modulo_id` documentado (que é o que o frontend, o `id` de cada questão e este próprio documento usam) e quebrava `GET /api/desafio-diario` sempre (via `parseQuestaoId`, que também deriva o `modulo_id` no formato documentado). **Corrigido** em `src/lib/content.ts`: um índice `modulo_id → nome do arquivo` é construído uma vez por processo (lendo todos os arquivos da pasta, ordenado pelo campo `ordem`), e `listarIdsModulos()`/`carregarModulo()` passaram a resolver por esse índice em vez de tratar o id como nome de arquivo.
- **Bônus do desafio diário (+30 XP) não recalculava `nivel` nem contava para a liga semanal** — `processarRespostaParaDesafioDiario()` incrementava `xpTotal` direto, sem chamar `calcularNivel()` nem `adicionarXpSemanal()`, diferente do XP de questão normal (`questao/responder/route.ts`), que faz as duas coisas. **Corrigido** em `src/lib/desafioDiario.ts` — mesmo tratamento dos dois lugares agora.

Ambos confirmados corrigidos rodando o fluxo de novo contra o banco real (não só por inspeção de código).

## Cadastro por nickname + aprovação de admin (2026-08-11)

Duas mudanças de identidade/acesso no model `Usuario`:

- **`nickname` (`String @unique`) substitui `email` como identificador de login.** `email` virou opcional (`String? @unique`) — mantido só por compatibilidade, não é mais coletado no cadastro nem usado em nenhuma rota. Sempre normalizado para minúsculas antes de gravar/comparar (`nickname.trim().toLowerCase()`), tanto no registro quanto no login — evita duas contas "JoaoSilva"/"joaosilva" incompatíveis sem precisar de extensão `citext` no Postgres.
- **`statusCadastro` (`enum StatusCadastro`: `PENDENTE` | `APROVADO` | `REJEITADO`, default `PENDENTE`)** — cadastro novo não loga automaticamente e não consegue entrar até um admin aprovar (`PATCH /api/admin/usuarios/[usuarioId]`). `obterSessaoAtual()` (`src/lib/auth.ts`) também confere `statusCadastro === "APROVADO"` a cada requisição, não só no login — se um admin rejeitar/desaprovar alguém com sessão já aberta, o acesso cai na próxima requisição, no mesmo espírito de `senhaAlteradaEm` para reset de senha. Substitui a restrição por domínio de e-mail (`DOMINIOS_EMAIL_PERMITIDOS`, removida) — mecanismo mais forte, e o único que ainda fazia sentido depois de tirar e-mail do cadastro.

**Migração em duas fases** (`prisma/migrations/`): `nickname` foi adicionado como opcional primeiro, backfilled para os usuários já existentes (nickname derivado do e-mail antigo, `statusCadastro` setado para `APROVADO` — ninguém que já tinha conta antes da aprovação existir devia ficar trancado para fora), só depois alterado para `NOT NULL`. Necessário porque `prisma migrate dev` não roda em ambiente não-interativo — as migrations foram geradas via `prisma migrate diff --script` e aplicadas com `prisma migrate deploy`.

## Próximos passos de modelagem (não bloqueiam o uso atual)

- Índices adicionais conforme os primeiros relatórios reais do painel administrativo forem definidos.
- Se um sistema de múltiplos escalões por liga for adotado no futuro (ver `docs/gamificacao.md`), a apuração semanal precisará ganhar lógica de movimentação entre `Liga`s — hoje ela só calcula posição dentro da liga única de cada equipe.
