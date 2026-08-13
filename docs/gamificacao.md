# Gamificação — Decisões de Produto

Este documento consolida todas as decisões de gamificação definidas durante o planejamento, para orientar a Fase 2 (backend) e a Fase 3 (frontend). Nenhum destes mecanismos está implementado ainda — este é o documento de especificação.

## Elementos confirmados

- **XP (pontos de experiência):** ganho por questão respondida corretamente. Sugestão: XP maior para tipos de questão mais exigentes (`correcao_prompt` e `resposta_curta_autoavaliada` deveriam valer mais do que `verdadeiro_falso`, por exemplo) — critério exato de pontuação por tipo fica para definição no início da Fase 2.
- **Streaks (ofensiva):** contagem de dias consecutivos de uso.
- **Streak freeze:** perdão de 1 dia sem quebrar a sequência, para reduzir abandono por frustração.
- **Níveis:** progressão de nível do usuário conforme XP acumulado.
- **Ranking / Ligas semanais:** grupos de usuários competem por XP da semana, com sistema de subida/descida de liga.
  - **Agrupamento confirmado: por equipe do escritório**, não por faixa de XP genérica. O usuário indica sua equipe no cadastro.
  - **Equipes iniciais (3):** Banco BMG, Banco Pine, C6 Bank. Modelado como uma tabela própria (`Equipe`), não um valor fixo em código — adicionar uma 4ª equipe no futuro é uma inserção de dado, não uma mudança de schema.
  - **Ligas exclusivas:** além da liga padrão de cada equipe, deve ser possível criar ligas com **condição de desbloqueio** — a primeira delas é "disponível somente para quem já concluiu a Trilha Básica". O modelo de dados suporta múltiplas condições futuras (ex: concluiu a Trilha Intermediária), não só essa.
- **Estrelas diárias — limite de 2 módulos novos por dia:** cada colaborador só pode *iniciar* 2 módulos novos por dia (`src/lib/limiteDiario.ts`). Reabrir um módulo já iniciado antes (concluído ou não) nunca consome estrela — é sempre livre, para permitir revisão. Esgotadas as estrelas, novos módulos só liberam no dia seguinte (reset automático por comparação de data, sem necessidade de rotina agendada). Isso é um mecanismo **diferente** dos corações: corações controlam erro *dentro* de um módulo já em andamento; estrelas controlam quantos módulos *novos* podem ser abertos por dia. Endpoint: `POST /api/progresso/modulo/iniciar` retorna `403` com `codigo: "limite_diario_atingido"` quando esgotado.
- **Desafio diário:** um conjunto de 5 questões sorteadas do módulo mais recente que o colaborador tocou (seu "nível" atual) — sempre conteúdo já visto antes, nunca matéria nova, então **não consome estrela diária**. Serve para dar algo a fazer mesmo depois de esgotadas as 2 estrelas do dia, mantendo engajamento sem deixar a pessoa "avançar" conteúdo além do limite diário. Concluir o desafio (responder as 5, independente de acerto) concede um bônus fixo de **+30 XP**, uma vez por dia. Como reaproveita questões já respondidas antes, XP normal por questão só é concedido se aquela questão específica nunca tinha sido acertada — o bônus do desafio é o único ganho garantido de XP novo naquele dia através dele. Endpoint: `GET /api/desafio-diario`.
- **Corações:** sistema de tentativas dentro de um módulo — ver detalhes e parâmetros já fechados na seção "Decisões confirmadas" abaixo.
- **Mapa de trilha visual:** progressão apresentada como um caminho visual entre módulos, não uma lista simples.
- **Badges temáticas:** conquistas nomeadas e contextualizadas ao universo jurídico. Badges já definidas durante a criação de conteúdo:
  - **"Letrado em IA"** — concluir a Trilha Básica (10 módulos). Ver `content/transicoes/transicao-trilha-basica-para-intermediaria.json`.
  - **"Arquiteto de Prompts"** — concluir o Bloco A da Trilha Intermediária. Ver `content/trilha-intermediaria/modulos/modulo-06.json`, campo `conquista_de_bloco`.
  - Demais badges de bloco (Blocos B, C, D, E) já estão definidas no conteúdo da Trilha Intermediária — procurar pelo campo `conquista_de_bloco` no último módulo de cada bloco.
- **Certificado:** emitido ao concluir uma trilha completa. Modelo de texto-base já definido no arquivo de transição entre trilhas.

## Convenção de dados usada no conteúdo (para o backend ler corretamente)

- `modulo_id`: identificador estável de cada módulo — usar como chave de progresso do usuário.
- `id` de questão (formato `{trilha}-{modulo}-q{n}`): chave estável para tracking de acerto/erro por questão.
- `revisao_de`: campo opcional em uma questão, apontando para outro `modulo_id` — sinaliza que aquela questão reativa conteúdo antigo. Pode ser usado para métricas de retenção e, no futuro, para lógica de repetição espaçada mais robusta (reapresentar questões erradas ou antigas periodicamente).
- `conquista_de_bloco`: campo opcional, presente apenas no último módulo de cada bloco da Trilha Intermediária — contém nome e descrição da badge daquele bloco.
- `DesafioDiario.questaoIds`: lista de IDs de questão no mesmo formato `{trilha}-{modulo}-q{n}` — o backend deriva `trilha`/`moduloId` do próprio ID (`parseQuestaoId`, em `src/lib/content.ts`), sem precisar guardar isso separado.
- `XpConcedido`: tabela de controle interna (não é conceito de gamificação em si) — garante que XP nunca é concedido duas vezes pela mesma questão, mesmo sob requisições concorrentes. Ver `docs/modelagem-dados.md`.

## Decisões confirmadas nesta rodada

- Estrutura de ligas por equipe (ver acima) — substitui a proposta genérica por faixa de XP.
- XP por tipo de questão, corações e streak freeze: adotados como padrão inicial, conforme proposto abaixo — ajustável, mas não bloqueia o início da modelagem.
  - XP: `verdadeiro_falso` / `completar_lacuna` = 10 · `multipla_escolha` / `associacao` / `ordenar_etapas` = 15 · `correcao_prompt` = 20 · `resposta_curta_autoavaliada` = 25.
  - Corações: 5 no total, compartilhados entre módulos (não resetam ao iniciar um módulo novo, nem por sessão) — ao chegarem a 0, regeneram automaticamente para 5 depois de 2h, sem nenhuma ação do usuário (`src/lib/coracoes.ts`).
  - Streak freeze: 1 por semana, acumulável até no máximo 2.
  - Estrelas diárias: 2 módulos novos por dia, reset na virada do dia no fuso de Brasília (UTC-3 fixo — o público é 100% do escritório, aqui).
  - Desafio diário: 5 questões, bônus de +30 XP ao concluir, uma vez por dia.
- Existe perfil de **administrador/gestor** com visão agregada da equipe, já no MVP.

## Decisões ainda em aberto

- Nenhuma pendência de regras centrais no momento — a única questão que restava (corte de subida/descida entre ligas) foi resolvida pela própria arquitetura: como cada equipe tem hoje uma única liga (não um sistema de escalões tipo bronze/prata/ouro), a apuração semanal (`/api/cron/semanal`, ver `docs/modelagem-dados.md`) só calcula a posição final de cada um dentro da própria liga — não há "subida" nem "descida" para calcular. Se no futuro quiserem múltiplos escalões por equipe (mais fiel ao modelo Duolingo original), isso exigiria criar mais de uma `Liga` por equipe e uma regra de movimentação entre elas — não é mudança de schema, só de dado + lógica de aplicação nova.
- Mecanismo de repetição espaçada nível 2 (reapresentação futura de questões, não só o campo `revisao_de` estático já presente no conteúdo) — segue não implementado.
